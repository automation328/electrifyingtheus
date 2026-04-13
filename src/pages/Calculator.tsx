import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Car,
  Zap,
  Fuel,
  DollarSign,
  Leaf,
  BarChart3,
  ChevronRight,
  TrendingDown,
  Clock,
  MapPin,
  Info,
} from "lucide-react";
import { vehicles, getVehiclesByType, getMatchingGasVehicle } from "@/data/vehicles";
import {
  calculateTCO,
  compareVehicles,
  defaultInputs,
  type UserInputs,
  type ComparisonResult,
  type VehicleData,
} from "@/lib/tco-calculator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

const Calculator = () => {
  const [step, setStep] = useState(1);
  const [selectedEV, setSelectedEV] = useState<string>("tesla-model-3");
  const [selectedGas, setSelectedGas] = useState<string>("toyota-camry");
  const [inputs, setInputs] = useState<UserInputs>(defaultInputs);
  const [showResults, setShowResults] = useState(false);

  const evVehicles = getVehiclesByType("ev");
  const gasVehicles = getVehiclesByType("gas");

  const updateInput = (key: keyof UserInputs, value: number | string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const comparison = useMemo<ComparisonResult | null>(() => {
    if (!showResults) return null;
    const ev = vehicles.find((v) => v.id === selectedEV);
    const gas = vehicles.find((v) => v.id === selectedGas);
    if (!ev || !gas) return null;
    const evResult = calculateTCO(ev, inputs);
    const gasResult = calculateTCO(gas, inputs);
    return compareVehicles(evResult, gasResult);
  }, [showResults, selectedEV, selectedGas, inputs]);

  const handleCalculate = () => {
    setShowResults(true);
    setStep(3);
  };

  const handleAutoMatch = () => {
    const match = getMatchingGasVehicle(selectedEV);
    if (match) setSelectedGas(match.id);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const formatNumber = (n: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-10">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
              EV vs Gas <span className="text-gradient-primary">TCO Calculator</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Compare the true cost of owning an electric vehicle versus a gas vehicle over time.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-10">
            {[
              { n: 1, label: "Select Vehicles" },
              { n: 2, label: "Your Details" },
              { n: 3, label: "Results" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <button
                  onClick={() => { if (s.n < step || (s.n <= 2)) { setStep(s.n); if (s.n < 3) setShowResults(false); }}}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    step >= s.n
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs">
                    {s.n}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* Step 1: Vehicle Selection */}
          {step === 1 && (
            <div className="animate-fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gas Selection */}
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <Fuel className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Gas Vehicle</h3>
                      <p className="text-sm text-muted-foreground">Choose comparison vehicle</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {gasVehicles.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedGas(v.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedGas === v.id
                            ? "border-secondary bg-secondary/5 shadow-md"
                            : "border-border hover:border-secondary/30"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-foreground">{v.name}</p>
                            <p className="text-sm text-muted-foreground">{v.category} • {v.mpg} MPG</p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(v.msrp)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* EV Selection */}
                <div className="p-6 rounded-2xl border border-primary/20 bg-card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Electric Vehicle</h3>
                      <p className="text-sm text-muted-foreground">Choose your EV</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {evVehicles.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => { setSelectedEV(v.id); handleAutoMatch(); }}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedEV === v.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-foreground">{v.name}</p>
                            <p className="text-sm text-muted-foreground">{v.category} • {v.kwhPer100mi} kWh/100mi</p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(v.msrp)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              </div>

              <div className="flex justify-end mt-8">
                <Button variant="hero" size="lg" className="rounded-2xl px-8" onClick={() => setStep(2)}>
                  Next: Your Details
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: User Inputs */}
          {step === 2 && (
            <div className="animate-fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Driving & Ownership */}
                <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    Driving & Ownership
                  </h3>

                  <div>
                    <Label className="text-sm text-muted-foreground">Annual Mileage: {formatNumber(inputs.annualMileage)} mi</Label>
                    <Slider
                      value={[inputs.annualMileage]}
                      onValueChange={([v]) => updateInput("annualMileage", v)}
                      min={5000} max={40000} step={1000}
                      className="mt-3"
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">Ownership Period: {inputs.ownershipYears} years</Label>
                    <Slider
                      value={[inputs.ownershipYears]}
                      onValueChange={([v]) => updateInput("ownershipYears", v)}
                      min={1} max={10} step={1}
                      className="mt-3"
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">State</Label>
                    <Select value={inputs.state} onValueChange={(v) => updateInput("state", v)}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">Charging Location</Label>
                    <Select value={inputs.chargingLocation} onValueChange={(v) => updateInput("chargingLocation", v as 'home' | 'public' | 'mixed')}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Home Charging</SelectItem>
                        <SelectItem value="public">Public Charging</SelectItem>
                        <SelectItem value="mixed">Mixed (Home + Public)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Costs & Financing */}
                <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-secondary" />
                    Costs & Financing
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Gas Price ($/gal)</Label>
                      <Input
                        type="number" step="0.01"
                        value={inputs.gasPricePerGallon}
                        onChange={(e) => updateInput("gasPricePerGallon", parseFloat(e.target.value) || 0)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Electricity ($/kWh)</Label>
                      <Input
                        type="number" step="0.01"
                        value={inputs.electricityRatePerKwh}
                        onChange={(e) => updateInput("electricityRatePerKwh", parseFloat(e.target.value) || 0)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">Down Payment: {inputs.downPaymentPercent}%</Label>
                    <Slider
                      value={[inputs.downPaymentPercent]}
                      onValueChange={([v]) => updateInput("downPaymentPercent", v)}
                      min={0} max={100} step={5}
                      className="mt-3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">APR (%)</Label>
                      <Input
                        type="number" step="0.1"
                        value={inputs.financingRate}
                        onChange={(e) => updateInput("financingRate", parseFloat(e.target.value) || 0)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Loan Term (months)</Label>
                      <Input
                        type="number"
                        value={inputs.loanTermMonths}
                        onChange={(e) => updateInput("loanTermMonths", parseInt(e.target.value) || 0)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Federal EV Incentive</Label>
                      <Input
                        type="number"
                        value={inputs.federalIncentive}
                        onChange={(e) => updateInput("federalIncentive", parseInt(e.target.value) || 0)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">State EV Incentive</Label>
                      <Input
                        type="number"
                        value={inputs.stateIncentive}
                        onChange={(e) => updateInput("stateIncentive", parseInt(e.target.value) || 0)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" size="lg" className="rounded-2xl" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button variant="hero" size="lg" className="rounded-2xl px-8" onClick={handleCalculate}>
                  Calculate TCO
                  <BarChart3 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && comparison && (
            <div className="animate-fade-up space-y-8">
              {/* Winner Banner */}
              <div className={`p-8 rounded-3xl border-2 ${
                comparison.winner === "ev"
                  ? "border-primary bg-primary/5"
                  : comparison.winner === "gas"
                  ? "border-secondary bg-secondary/5"
                  : "border-border bg-muted/30"
              }`}>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    {comparison.winner === "ev" ? <Zap className="w-4 h-4" /> : <Fuel className="w-4 h-4" />}
                    {comparison.winner === "tie" ? "It's a Tie!" : `${comparison.winner === "ev" ? comparison.ev.vehicle.name : comparison.gas.vehicle.name} Wins!`}
                  </div>
                  <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
                    {comparison.winner === "tie"
                      ? "Both options are within $500"
                      : `Save ${formatCurrency(Math.abs(comparison.savingsOverOwnership))} over ${inputs.ownershipYears} years`}
                  </h2>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    {comparison.winner === "ev"
                      ? `The ${comparison.ev.vehicle.name} costs less to own than the ${comparison.gas.vehicle.name} over ${inputs.ownershipYears} years.`
                      : comparison.winner === "gas"
                      ? `The ${comparison.gas.vehicle.name} is more affordable over this ownership period.`
                      : "The costs are very close. Consider other factors like driving experience and environmental impact."}
                  </p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Break-Even", value: `${formatNumber(comparison.breakEvenMiles)} mi`, icon: MapPin, color: "text-primary" },
                  { label: "Payback Period", value: comparison.paybackYears < 20 ? `${comparison.paybackYears.toFixed(1)} yrs` : "N/A", icon: Clock, color: "text-secondary" },
                  { label: "CO₂ Saved", value: `${comparison.co2SavingsTons.toFixed(1)} tons`, icon: Leaf, color: "text-secondary" },
                  { label: "Monthly Diff", value: formatCurrency(Math.abs(comparison.ev.monthlyPayment - comparison.gas.monthlyPayment)), icon: TrendingDown, color: "text-primary" },
                ].map((m) => (
                  <div key={m.label} className="p-5 rounded-2xl bg-card border border-border text-center">
                    <m.icon className={`w-6 h-6 mx-auto mb-2 ${m.color}`} />
                    <p className="text-2xl font-bold text-foreground">{m.value}</p>
                    <p className="text-sm text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[comparison.ev, comparison.gas].map((result) => (
                  <div key={result.vehicle.id} className={`p-6 rounded-2xl border ${
                    result.vehicle.type === "ev" ? "border-primary/30" : "border-border"
                  } bg-card`}>
                    <div className="flex items-center gap-3 mb-6">
                      {result.vehicle.type === "ev" ? (
                        <Zap className="w-6 h-6 text-primary" />
                      ) : (
                        <Fuel className="w-6 h-6 text-muted-foreground" />
                      )}
                      <div>
                        <h3 className="font-bold text-foreground text-lg">{result.vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">{result.vehicle.category}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: "Total Cost of Ownership", value: formatCurrency(result.totalCostOfOwnership), bold: true },
                        { label: "Purchase (financed)", value: formatCurrency(result.purchaseCost) },
                        { label: "Fuel / Energy", value: formatCurrency(result.totalFuelCost) },
                        { label: "Maintenance", value: formatCurrency(result.totalMaintenanceCost) },
                        { label: "Insurance", value: formatCurrency(result.totalInsuranceCost) },
                        { label: "Incentives", value: `-${formatCurrency(result.totalIncentives)}`, green: result.totalIncentives > 0 },
                        { label: "Residual Value", value: `-${formatCurrency(result.residualValue)}` },
                        { label: "Cost per Mile", value: `$${result.costPerMile.toFixed(2)}` },
                        { label: "Monthly Payment", value: formatCurrency(result.monthlyPayment) },
                        { label: "Annual Fuel Cost", value: formatCurrency(result.annualFuelCost) },
                        { label: "CO₂ Emissions", value: `${result.co2EmissionsTons.toFixed(1)} tons` },
                      ].map((row) => (
                        <div key={row.label} className={`flex justify-between items-center ${row.bold ? "pt-2 border-t border-border" : ""}`}>
                          <span className={`text-sm ${row.bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>{row.label}</span>
                          <span className={`text-sm font-medium ${row.bold ? "text-xl font-bold text-foreground" : row.green ? "text-secondary" : "text-foreground"}`}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Confidence Note */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <strong>Data Confidence: Medium</strong> — These calculations use estimated averages for maintenance, insurance, and depreciation.
                  Actual costs vary by location, driving habits, and market conditions. Gas and electricity prices are editable defaults.
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" size="lg" className="rounded-2xl" onClick={() => { setStep(1); setShowResults(false); }}>
                  Start Over
                </Button>
                <Button variant="hero" size="lg" className="rounded-2xl" onClick={() => setStep(2)}>
                  Adjust Assumptions
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Calculator;
