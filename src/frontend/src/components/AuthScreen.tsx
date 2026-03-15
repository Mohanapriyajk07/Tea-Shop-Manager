import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLogin, useRegisterShop, useRequestOtp } from "@/hooks/useQueries";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AuthScreenProps {
  onAuthSuccess: (mobileNumber: string, shopName: string) => void;
}

type LoginStep = "mobile" | "otp";

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [loginStep, setLoginStep] = useState<LoginStep>("mobile");
  const [loginMobile, setLoginMobile] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [displayedOtp, setDisplayedOtp] = useState("");

  const [regShopName, setRegShopName] = useState("");
  const [regOwnerName, setRegOwnerName] = useState("");
  const [regMobile, setRegMobile] = useState("");

  const requestOtpMutation = useRequestOtp();
  const loginMutation = useLogin();
  const registerMutation = useRegisterShop();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginMobile || loginMobile.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    try {
      const otp = await requestOtpMutation.mutateAsync(loginMobile);
      setDisplayedOtp(otp);
      setLoginStep("otp");
      toast.success("OTP generated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate OTP",
      );
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtp || loginOtp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    try {
      await loginMutation.mutateAsync({
        mobileNumber: loginMobile,
        otp: loginOtp,
      });
      toast.success("Welcome back!");
      onAuthSuccess(loginMobile, "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regShopName || !regOwnerName || !regMobile) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await registerMutation.mutateAsync({
        name: regShopName,
        ownerName: regOwnerName,
        mobileNumber: regMobile,
      });
      toast.success("Shop registered! Please log in.");
      onAuthSuccess(regMobile, regShopName);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      {/* Logo / Header */}
      <div className="mb-8 text-center animate-fade-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl tea-gradient mb-3 shadow-card">
          <span className="text-3xl">🍵</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
          Tea Shop Manager
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your stock, sales &amp; profits
        </p>
      </div>

      <Card className="w-full max-w-md shadow-card border-border animate-fade-up">
        <Tabs defaultValue="login">
          <CardHeader className="pb-0">
            <TabsList className="w-full" data-ocid="auth.tab">
              <TabsTrigger
                value="login"
                className="flex-1"
                data-ocid="auth.login.tab"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1"
                data-ocid="auth.register.tab"
              >
                Register
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          {/* LOGIN */}
          <TabsContent value="login">
            {loginStep === "mobile" ? (
              <form onSubmit={handleRequestOtp}>
                <CardContent className="space-y-4 pt-4">
                  <CardTitle className="text-lg font-display">
                    Welcome back
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Enter your mobile number to receive an OTP
                  </CardDescription>

                  <div className="space-y-1.5">
                    <Label htmlFor="login-mobile">Mobile Number</Label>
                    <Input
                      id="login-mobile"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={loginMobile}
                      onChange={(e) =>
                        setLoginMobile(e.target.value.replace(/\D/g, ""))
                      }
                      maxLength={10}
                      data-ocid="auth.mobile.input"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full tea-gradient text-primary-foreground"
                    disabled={requestOtpMutation.isPending}
                    data-ocid="auth.send_otp.button"
                  >
                    {requestOtpMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Sending OTP...
                      </>
                    ) : (
                      "Get OTP"
                    )}
                  </Button>
                </CardContent>
              </form>
            ) : (
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-green-500 h-5 w-5" />
                    <CardTitle className="text-lg font-display">
                      Enter OTP
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Your one-time password for{" "}
                    <span className="font-medium text-foreground">
                      {loginMobile}
                    </span>
                  </CardDescription>

                  {/* OTP Display Box */}
                  <div
                    className="bg-muted rounded-xl p-4 text-center border border-border"
                    data-ocid="auth.otp.panel"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      Your OTP is
                    </p>
                    <p className="text-3xl font-bold tracking-[0.3em] text-foreground font-mono">
                      {displayedOtp}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use this code to verify your login
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="login-otp">Enter OTP</Label>
                    <Input
                      id="login-otp"
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      value={loginOtp}
                      onChange={(e) =>
                        setLoginOtp(e.target.value.replace(/\D/g, ""))
                      }
                      data-ocid="auth.otp.input"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full tea-gradient text-primary-foreground"
                    disabled={loginMutation.isPending}
                    data-ocid="auth.submit_button"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Verifying...
                      </>
                    ) : (
                      "Verify & Login"
                    )}
                  </Button>

                  <button
                    type="button"
                    className="w-full text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                    onClick={() => {
                      setLoginStep("mobile");
                      setLoginOtp("");
                      setDisplayedOtp("");
                    }}
                    data-ocid="auth.back.button"
                  >
                    Back to mobile number
                  </button>
                </CardContent>
              </form>
            )}
          </TabsContent>

          {/* REGISTER */}
          <TabsContent value="register">
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4 pt-4">
                <CardTitle className="text-lg font-display">
                  Register Your Shop
                </CardTitle>
                <CardDescription className="text-xs">
                  Set up your tea shop account
                </CardDescription>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-shop">Shop Name</Label>
                  <Input
                    id="reg-shop"
                    placeholder="e.g. Sharma Tea Stall"
                    value={regShopName}
                    onChange={(e) => setRegShopName(e.target.value)}
                    data-ocid="auth.shop_name.input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-owner">Owner Name</Label>
                  <Input
                    id="reg-owner"
                    placeholder="e.g. Ramesh Sharma"
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    data-ocid="auth.owner_name.input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-mobile">Mobile Number</Label>
                  <Input
                    id="reg-mobile"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    data-ocid="auth.reg_mobile.input"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full tea-gradient text-primary-foreground"
                  disabled={registerMutation.isPending}
                  data-ocid="auth.submit_button"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Registering...
                    </>
                  ) : (
                    "Register Shop"
                  )}
                </Button>
              </CardContent>
            </form>
          </TabsContent>
        </Tabs>
      </Card>

      <p className="mt-8 text-xs text-muted-foreground text-center">
        &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
