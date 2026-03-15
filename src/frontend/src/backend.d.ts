import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface DashboardData {
    stockEntries: Array<StockEntry>;
    totalInvestment: bigint;
    profitLoss: bigint;
    totalSales: bigint;
    saleEntries: Array<SaleEntry>;
}
export interface SaleEntry {
    totalSalesAmount: bigint;
    date: Time;
}
export interface Shop {
    pin: bigint;
    ownerName: string;
    name: string;
    mobileNumber: string;
}
export interface UserProfile {
    name: string;
    mobileNumber: string;
    shopName: string;
}
export interface StockEntry {
    date: Time;
    unit: string;
    costAmount: bigint;
    itemName: string;
    quantity: bigint;
    category: Category;
}
export enum Category {
    other = "other",
    milk = "milk",
    tea_powder = "tea_powder",
    snacks = "snacks"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addSaleEntry(totalSalesAmount: bigint): Promise<void>;
    addSaleEntryByMobile(mobileNumber: string, totalSalesAmount: bigint): Promise<void>;
    addStockEntry(category: Category, itemName: string, quantity: bigint, unit: string, costAmount: bigint): Promise<void>;
    addStockEntryByMobile(mobileNumber: string, category: Category, itemName: string, quantity: bigint, unit: string, costAmount: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardData(startDate: Time, endDate: Time): Promise<DashboardData>;
    getDashboardDataByMobile(mobileNumber: string, startDate: Time, endDate: Time): Promise<DashboardData>;
    getMonthlyDashboard(year: bigint, month: bigint): Promise<DashboardData>;
    getMonthlyDashboardByMobile(mobileNumber: string, year: bigint, month: bigint): Promise<DashboardData>;
    getShopInfo(): Promise<Shop | null>;
    getShopInfoByMobile(mobileNumber: string): Promise<Shop | null>;
    getUserProfileByMobile(mobileNumber: string): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    login(mobileNumber: string, otp: string): Promise<boolean>;
    loginByMobile(mobileNumber: string, otp: string): Promise<boolean>;
    registerShop(name: string, ownerName: string, mobileNumber: string): Promise<void>;
    requestOtp(mobileNumber: string): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
