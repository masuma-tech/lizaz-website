import dns from "dns";
import "dotenv/config";

// Supabase direct hostnames are IPv6-only; Windows Node needs this to resolve them.
dns.setDefaultResultOrder("ipv6first");
