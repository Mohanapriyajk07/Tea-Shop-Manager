import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type Category = {
    #milk;
    #tea_powder;
    #snacks;
    #other;
  };

  public type StockEntry = {
    date : Time.Time;
    category : Category;
    itemName : Text;
    quantity : Nat;
    unit : Text;
    costAmount : Nat;
  };

  public type SaleEntry = {
    date : Time.Time;
    totalSalesAmount : Nat;
  };

  // pin field kept for stable data compatibility -- no longer used for auth
  public type Shop = {
    name : Text;
    ownerName : Text;
    mobileNumber : Text;
    pin : Nat;
  };

  public type UserProfile = {
    name : Text;
    shopName : Text;
    mobileNumber : Text;
  };

  public type DashboardData = {
    totalInvestment : Nat;
    totalSales : Nat;
    profitLoss : Int;
    stockEntries : [StockEntry];
    saleEntries : [SaleEntry];
  };

  let shops = Map.empty<Principal, Shop>();
  let stockEntries = Map.empty<Principal, List.List<StockEntry>>();
  let saleEntries = Map.empty<Principal, List.List<SaleEntry>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let mobileToUser = Map.empty<Text, Principal>();
  let otpStore = Map.empty<Text, Text>(); // mobileNumber -> OTP

  // Simple pseudo-random OTP using Time
  func generateOtpCode(_ : Text) : Text {
    let seed = Time.now();
    let n = seed.toNat() % 1_000_000;
    let s = n.toText();
    // Pad to 6 digits
    let pad = 6 - s.size();
    var prefix = "";
    var i = 0;
    while (i < pad) {
      prefix := prefix # "0";
      i += 1;
    };
    prefix # s;
  };

  // Generate and store OTP for a mobile number, returns the OTP (displayed on screen since no SMS)
  public shared func requestOtp(mobileNumber : Text) : async Text {
    let otp = generateOtpCode(mobileNumber);
    otpStore.add(mobileNumber, otp);
    otp;
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query func getUserProfileByMobile(mobileNumber : Text) : async ?UserProfile {
    let userPrincipal = mobileToUser.get(mobileNumber);
    switch (userPrincipal) {
      case (null) { null };
      case (?user) { userProfiles.get(user) };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // Shop Registration -- pin stored as 0, no longer required for auth
  public shared ({ caller }) func registerShop(name : Text, ownerName : Text, mobileNumber : Text) : async () {
    if (shops.containsKey(caller)) {
      Runtime.trap("Shop already registered for this user");
    };
    if (mobileToUser.containsKey(mobileNumber)) {
      Runtime.trap("Mobile number already registered");
    };
    let shop : Shop = { name; ownerName; mobileNumber; pin = 0 };
    shops.add(caller, shop);
    mobileToUser.add(mobileNumber, caller);
    let profile : UserProfile = { name = ownerName; shopName = name; mobileNumber };
    userProfiles.add(caller, profile);
    // Directly assign user role without requiring admin
    accessControlState.userRoles.add(caller, #user);
  };

  // Login with OTP verification only -- pin no longer checked
  public shared func loginByMobile(mobileNumber : Text, otp : Text) : async Bool {
    // Verify OTP
    let storedOtp = otpStore.get(mobileNumber);
    switch (storedOtp) {
      case (null) { Runtime.trap("OTP not found. Please request a new OTP.") };
      case (?o) {
        if (o != otp) { Runtime.trap("Invalid OTP. Please try again.") };
        otpStore.remove(mobileNumber);
      };
    };

    let userPrincipal = mobileToUser.get(mobileNumber);
    switch (userPrincipal) {
      case (null) { Runtime.trap("Mobile number not registered. Please register first.") };
      case (?_) { return true };
    };
  };

  // Keep old login function for compatibility
  public shared func login(mobileNumber : Text, otp : Text) : async Bool {
    await loginByMobile(mobileNumber, otp);
  };

  // Add Stock Entry -- identified by mobile number
  public shared func addStockEntryByMobile(mobileNumber : Text, category : Category, itemName : Text, quantity : Nat, unit : Text, costAmount : Nat) : async () {
    let userPrincipal = mobileToUser.get(mobileNumber);
    switch (userPrincipal) {
      case (null) { Runtime.trap("Mobile number not registered.") };
      case (?user) {
        let entry : StockEntry = { date = Time.now(); category; itemName; quantity; unit; costAmount };
        let entries = switch (stockEntries.get(user)) {
          case (null) { List.empty<StockEntry>() };
          case (?existing) { existing };
        };
        entries.add(entry);
        stockEntries.add(user, entries);
      };
    };
  };

  // Add Sale Entry -- identified by mobile number
  public shared func addSaleEntryByMobile(mobileNumber : Text, totalSalesAmount : Nat) : async () {
    let userPrincipal = mobileToUser.get(mobileNumber);
    switch (userPrincipal) {
      case (null) { Runtime.trap("Mobile number not registered.") };
      case (?user) {
        let entry : SaleEntry = { date = Time.now(); totalSalesAmount };
        let entries = switch (saleEntries.get(user)) {
          case (null) { List.empty<SaleEntry>() };
          case (?existing) { existing };
        };
        entries.add(entry);
        saleEntries.add(user, entries);
      };
    };
  };

  // Get Dashboard Data by mobile number
  public query func getDashboardDataByMobile(mobileNumber : Text, startDate : Time.Time, endDate : Time.Time) : async DashboardData {
    let userPrincipal = mobileToUser.get(mobileNumber);
    let user = switch (userPrincipal) {
      case (null) { Runtime.trap("Mobile number not registered.") };
      case (?u) { u };
    };
    let stockList = switch (stockEntries.get(user)) {
      case (null) { List.empty<StockEntry>() };
      case (?entries) { entries };
    };
    let saleList = switch (saleEntries.get(user)) {
      case (null) { List.empty<SaleEntry>() };
      case (?entries) { entries };
    };
    let filteredStock = stockList.filter(func(entry : StockEntry) : Bool { entry.date >= startDate and entry.date <= endDate });
    let filteredSales = saleList.filter(func(entry : SaleEntry) : Bool { entry.date >= startDate and entry.date <= endDate });
    var totalInvestment : Nat = 0;
    func sumStock(iter : Iter.Iter<StockEntry>) {
      switch (iter.next()) {
        case (null) {};
        case (?entry) { totalInvestment += entry.costAmount; sumStock(iter) };
      };
    };
    sumStock(filteredStock.values());
    var totalSales : Nat = 0;
    func sumSales(iter : Iter.Iter<SaleEntry>) {
      switch (iter.next()) {
        case (null) {};
        case (?entry) { totalSales += entry.totalSalesAmount; sumSales(iter) };
      };
    };
    sumSales(filteredSales.values());
    let profitLoss : Int = totalSales - totalInvestment;
    { totalInvestment; totalSales; profitLoss; stockEntries = filteredStock.toArray(); saleEntries = filteredSales.toArray() };
  };

  // Get Monthly Dashboard by mobile
  public query func getMonthlyDashboardByMobile(mobileNumber : Text, year : Nat, month : Nat) : async DashboardData {
    let userPrincipal = mobileToUser.get(mobileNumber);
    let user = switch (userPrincipal) {
      case (null) { Runtime.trap("Mobile number not registered.") };
      case (?u) { u };
    };
    ignore year;
    ignore month;
    let startDate : Time.Time = 0;
    let endDate : Time.Time = Time.now();
    let stockList = switch (stockEntries.get(user)) {
      case (null) { List.empty<StockEntry>() };
      case (?entries) { entries };
    };
    let saleList = switch (saleEntries.get(user)) {
      case (null) { List.empty<SaleEntry>() };
      case (?entries) { entries };
    };
    let filteredStock = stockList.filter(func(entry : StockEntry) : Bool { entry.date >= startDate and entry.date <= endDate });
    let filteredSales = saleList.filter(func(entry : SaleEntry) : Bool { entry.date >= startDate and entry.date <= endDate });
    var totalInvestment : Nat = 0;
    func sumStock(iter : Iter.Iter<StockEntry>) {
      switch (iter.next()) {
        case (null) {};
        case (?entry) { totalInvestment += entry.costAmount; sumStock(iter) };
      };
    };
    sumStock(filteredStock.values());
    var totalSales : Nat = 0;
    func sumSales(iter : Iter.Iter<SaleEntry>) {
      switch (iter.next()) {
        case (null) {};
        case (?entry) { totalSales += entry.totalSalesAmount; sumSales(iter) };
      };
    };
    sumSales(filteredSales.values());
    let profitLoss : Int = totalSales - totalInvestment;
    { totalInvestment; totalSales; profitLoss; stockEntries = filteredStock.toArray(); saleEntries = filteredSales.toArray() };
  };

  // Get Shop Info by mobile
  public query func getShopInfoByMobile(mobileNumber : Text) : async ?Shop {
    let userPrincipal = mobileToUser.get(mobileNumber);
    switch (userPrincipal) {
      case (null) { null };
      case (?user) { shops.get(user) };
    };
  };

  // Legacy caller-based functions (kept for compatibility)
  public query ({ caller }) func getShopInfo() : async ?Shop {
    shops.get(caller);
  };

  public shared ({ caller }) func addStockEntry(category : Category, itemName : Text, quantity : Nat, unit : Text, costAmount : Nat) : async () {
    let shop = shops.get(caller);
    switch (shop) {
      case (null) { Runtime.trap("Shop not found. Please register first.") };
      case (?_) {};
    };
    let entry : StockEntry = { date = Time.now(); category; itemName; quantity; unit; costAmount };
    let entries = switch (stockEntries.get(caller)) {
      case (null) { List.empty<StockEntry>() };
      case (?existing) { existing };
    };
    entries.add(entry);
    stockEntries.add(caller, entries);
  };

  public shared ({ caller }) func addSaleEntry(totalSalesAmount : Nat) : async () {
    let shop = shops.get(caller);
    switch (shop) {
      case (null) { Runtime.trap("Shop not found. Please register first.") };
      case (?_) {};
    };
    let entry : SaleEntry = { date = Time.now(); totalSalesAmount };
    let entries = switch (saleEntries.get(caller)) {
      case (null) { List.empty<SaleEntry>() };
      case (?existing) { existing };
    };
    entries.add(entry);
    saleEntries.add(caller, entries);
  };

  public query ({ caller }) func getDashboardData(startDate : Time.Time, endDate : Time.Time) : async DashboardData {
    let stockList = switch (stockEntries.get(caller)) {
      case (null) { List.empty<StockEntry>() };
      case (?entries) { entries };
    };
    let saleList = switch (saleEntries.get(caller)) {
      case (null) { List.empty<SaleEntry>() };
      case (?entries) { entries };
    };
    let filteredStock = stockList.filter(func(entry : StockEntry) : Bool { entry.date >= startDate and entry.date <= endDate });
    let filteredSales = saleList.filter(func(entry : SaleEntry) : Bool { entry.date >= startDate and entry.date <= endDate });
    var totalInvestment : Nat = 0;
    func sumStock(iter : Iter.Iter<StockEntry>) {
      switch (iter.next()) {
        case (null) {};
        case (?entry) { totalInvestment += entry.costAmount; sumStock(iter) };
      };
    };
    sumStock(filteredStock.values());
    var totalSales : Nat = 0;
    func sumSales(iter : Iter.Iter<SaleEntry>) {
      switch (iter.next()) {
        case (null) {};
        case (?entry) { totalSales += entry.totalSalesAmount; sumSales(iter) };
      };
    };
    sumSales(filteredSales.values());
    let profitLoss : Int = totalSales - totalInvestment;
    { totalInvestment; totalSales; profitLoss; stockEntries = filteredStock.toArray(); saleEntries = filteredSales.toArray() };
  };

  public query ({ caller }) func getMonthlyDashboard(year : Nat, month : Nat) : async DashboardData {
    ignore year;
    ignore month;
    let startDate : Time.Time = 0;
    let endDate : Time.Time = Time.now();
    let stockList = switch (stockEntries.get(caller)) {
      case (null) { List.empty<StockEntry>() };
      case (?entries) { entries };
    };
    let saleList = switch (saleEntries.get(caller)) {
      case (null) { List.empty<SaleEntry>() };
      case (?entries) { entries };
    };
    let filteredStock = stockList.filter(func(entry : StockEntry) : Bool { entry.date >= startDate and entry.date <= endDate });
    let filteredSales = saleList.filter(func(entry : SaleEntry) : Bool { entry.date >= startDate and entry.date <= endDate });
    var totalInvestment : Nat = 0;
    func sumStock(iter : Iter.Iter<StockEntry>) {
      switch (iter.next()) {
        case (null) {};
        case (?entry) { totalInvestment += entry.costAmount; sumStock(iter) };
      };
    };
    sumStock(filteredStock.values());
    var totalSales : Nat = 0;
    func sumSales(iter : Iter.Iter<SaleEntry>) {
      switch (iter.next()) {
        case (null) {};
        case (?entry) { totalSales += entry.totalSalesAmount; sumSales(iter) };
      };
    };
    sumSales(filteredSales.values());
    let profitLoss : Int = totalSales - totalInvestment;
    { totalInvestment; totalSales; profitLoss; stockEntries = filteredStock.toArray(); saleEntries = filteredSales.toArray() };
  };
};
