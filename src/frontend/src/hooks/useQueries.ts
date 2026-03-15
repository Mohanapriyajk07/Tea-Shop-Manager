import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Category } from "../backend.d";
import type { DashboardData } from "../backend.d";
import { useActor } from "./useActor";

const AUTH_KEY = "teashop_auth";

function getMobileNumber(): string {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { mobileNumber: string };
      return parsed.mobileNumber || "";
    }
  } catch {
    // ignore
  }
  return "";
}

export function useRequestOtp() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (mobileNumber: string) => {
      if (!actor) throw new Error("Actor not ready");
      const otp = await actor.requestOtp(mobileNumber);
      return otp;
    },
  });
}

export function useLogin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      mobileNumber,
      otp,
    }: {
      mobileNumber: string;
      otp: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const success = await actor.loginByMobile(mobileNumber, otp);
      if (!success) throw new Error("Invalid mobile number or OTP");
      return success;
    },
  });
}

export function useRegisterShop() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      name,
      ownerName,
      mobileNumber,
    }: {
      name: string;
      ownerName: string;
      mobileNumber: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.registerShop(name, ownerName, mobileNumber);
    },
  });
}

export function useShopInfo() {
  const { actor, isFetching } = useActor();
  const mobileNumber = getMobileNumber();
  return useQuery({
    queryKey: ["shopInfo", mobileNumber],
    queryFn: async () => {
      if (!actor || !mobileNumber) return null;
      return actor.getShopInfoByMobile(mobileNumber);
    },
    enabled: !!actor && !isFetching && !!mobileNumber,
  });
}

export function useMonthlyDashboard(year: number, month: number) {
  const { actor, isFetching } = useActor();
  const mobileNumber = getMobileNumber();
  return useQuery<DashboardData>({
    queryKey: ["monthlyDashboard", year, month, mobileNumber],
    queryFn: async () => {
      if (!actor || !mobileNumber)
        return {
          stockEntries: [],
          saleEntries: [],
          totalInvestment: 0n,
          totalSales: 0n,
          profitLoss: 0n,
        };
      return actor.getMonthlyDashboardByMobile(
        mobileNumber,
        BigInt(year),
        BigInt(month),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllHistory() {
  const { actor, isFetching } = useActor();
  const mobileNumber = getMobileNumber();
  const now = new Date();
  const startDate = new Date(now.getFullYear() - 2, 0, 1);
  return useQuery<DashboardData>({
    queryKey: ["allHistory", mobileNumber],
    queryFn: async () => {
      if (!actor || !mobileNumber)
        return {
          stockEntries: [],
          saleEntries: [],
          totalInvestment: 0n,
          totalSales: 0n,
          profitLoss: 0n,
        };
      return actor.getDashboardDataByMobile(
        mobileNumber,
        BigInt(startDate.getTime()) * 1_000_000n,
        BigInt(now.getTime()) * 1_000_000n,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddStockEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      category: Category;
      itemName: string;
      quantity: number;
      unit: string;
      costAmount: number;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const mobileNumber = getMobileNumber();
      if (!mobileNumber) throw new Error("Not logged in");
      await actor.addStockEntryByMobile(
        mobileNumber,
        data.category,
        data.itemName,
        BigInt(Math.round(data.quantity)),
        data.unit,
        BigInt(Math.round(data.costAmount)),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthlyDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["allHistory"] });
    },
  });
}

export function useAddSaleEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (totalSalesAmount: number) => {
      if (!actor) throw new Error("Actor not ready");
      const mobileNumber = getMobileNumber();
      if (!mobileNumber) throw new Error("Not logged in");
      await actor.addSaleEntryByMobile(
        mobileNumber,
        BigInt(Math.round(totalSalesAmount)),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthlyDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["allHistory"] });
    },
  });
}

export { Category };
