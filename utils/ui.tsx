import {
  Landmark,
  TrendingUp,
  Building2,
  Globe,
  Shield,
  DollarSign,
  Users,
  Factory,
  Car,
  Plane,
  Ship,
  Home,
} from "lucide-react";

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Government Bonds":
      return <Landmark className="h-6 w-6" />;
    case "DeFi":
      return <TrendingUp className="h-6 w-6" />;
    case "Real Estate":
      return <Building2 className="h-6 w-6" />;
    case "Commodities":
      return <Globe className="h-6 w-6" />;
    case "ESG":
      return <Shield className="h-6 w-6" />;
    case "Money Market":
      return <DollarSign className="h-6 w-6" />;
    case "Green Energy":
      return <Users className="h-6 w-6" />;
    case "Infrastructure":
      return <Factory className="h-6 w-6" />;
    case "Transportation":
      return <Car className="h-6 w-6" />;
    case "Aviation":
      return <Plane className="h-6 w-6" />;
    case "Maritime":
      return <Ship className="h-6 w-6" />;
    default:
      return <Home className="h-6 w-6" />;
  }
};

export const getRiskColor = (riskLevel?: string) => {
  switch (riskLevel) {
    case "Low":
      return "bg-green-100 text-green-800 border-green-200";
    case "Medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "High":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const getIssuerColor = (issuer: string) => {
  switch (issuer) {
    case "US Treasury":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Spiko Finance":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "VN Government":
      return "bg-red-100 text-red-800 border-red-200";
    case "Gold Treasury":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "REIT Partners":
      return "bg-green-100 text-green-800 border-green-200";
    case "Carbon Credit Exchange":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Stablecoin Reserve":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "Infrastructure Fund":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};
