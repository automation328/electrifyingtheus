// Curated icon set for the Icon block. Kept to a generous but bounded list (so
// the picker has plenty of options and every pickable icon is also renderable on
// the public page, without pulling all ~1500 lucide icons into the bundle).

import {
  Zap, Leaf, BatteryCharging, Battery, Car, CarFront, Truck, Bus, Bike, Plane, Ship, TrainFront,
  Sun, Wind, Cloud, CloudRain, Droplet, Flame, Snowflake, Thermometer, Recycle, TreePine, Sprout, Globe,
  DollarSign, PiggyBank, Wallet, CreditCard, TrendingUp, TrendingDown, LineChart, BarChart3, PieChart, Percent, Tag, Receipt,
  ShieldCheck, Shield, Lock, Gauge, Plug, PlugZap, Fuel, Wrench, Settings, Cog, Cpu, Wifi,
  Sparkles, Star, Heart, ThumbsUp, Award, Trophy, Medal, Crown, Flag, Target, Rocket, Lightbulb,
  CheckCircle2, Check, XCircle, AlertCircle, AlertTriangle, Info, HelpCircle, Bell, Clock, Calendar, MapPin, Navigation,
  Users, User, UserCheck, Building2, Home, Factory, Store, Briefcase, GraduationCap, BookOpen, FileText, Clipboard,
  Mail, Phone, MessageCircle, Share2, Link2, Download, Upload, Search, Eye, Camera, Video, Image,
  type LucideIcon,
} from "lucide-react";

export const BLOCK_ICONS: Record<string, LucideIcon> = {
  zap: Zap, leaf: Leaf, "battery-charging": BatteryCharging, battery: Battery,
  car: Car, "car-front": CarFront, truck: Truck, bus: Bus, bike: Bike, plane: Plane, ship: Ship, train: TrainFront,
  sun: Sun, wind: Wind, cloud: Cloud, rain: CloudRain, droplet: Droplet, flame: Flame, snowflake: Snowflake, thermometer: Thermometer, recycle: Recycle, tree: TreePine, sprout: Sprout, globe: Globe,
  dollar: DollarSign, "piggy-bank": PiggyBank, wallet: Wallet, "credit-card": CreditCard, "trending-up": TrendingUp, "trending-down": TrendingDown, "line-chart": LineChart, "bar-chart": BarChart3, "pie-chart": PieChart, percent: Percent, tag: Tag, receipt: Receipt,
  "shield-check": ShieldCheck, shield: Shield, lock: Lock, gauge: Gauge, plug: Plug, "plug-zap": PlugZap, fuel: Fuel, wrench: Wrench, settings: Settings, cog: Cog, cpu: Cpu, wifi: Wifi,
  sparkles: Sparkles, star: Star, heart: Heart, "thumbs-up": ThumbsUp, award: Award, trophy: Trophy, medal: Medal, crown: Crown, flag: Flag, target: Target, rocket: Rocket, lightbulb: Lightbulb,
  check: CheckCircle2, "check-small": Check, "x-circle": XCircle, "alert-circle": AlertCircle, "alert-triangle": AlertTriangle, info: Info, help: HelpCircle, bell: Bell, clock: Clock, calendar: Calendar, pin: MapPin, navigation: Navigation,
  users: Users, user: User, "user-check": UserCheck, building: Building2, home: Home, factory: Factory, store: Store, briefcase: Briefcase, education: GraduationCap, book: BookOpen, "file-text": FileText, clipboard: Clipboard,
  mail: Mail, phone: Phone, message: MessageCircle, share: Share2, link: Link2, download: Download, upload: Upload, search: Search, eye: Eye, camera: Camera, video: Video, image: Image,
};

export const BLOCK_ICON_KEYS = Object.keys(BLOCK_ICONS);
