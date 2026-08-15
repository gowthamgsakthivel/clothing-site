'use client';
import React from 'react';
import { Zap, ShieldCheck, RefreshCw, Lock } from 'lucide-react';

const TrustBar = () => {
    const perks = [
        {
            icon: Zap,
            title: "Express Dispatch",
            subtitle: "Fast 24-48h dispatch across India",
            color: "text-amber-500",
            bg: "bg-amber-50"
        },
        {
            icon: ShieldCheck,
            title: "100% Authentic Gear",
            subtitle: "Athlete-tested performance fabrics",
            color: "text-emerald-500",
            bg: "bg-emerald-50"
        },
        {
            icon: RefreshCw,
            title: "7-Day Easy Exchange",
            subtitle: "Hassle-free size swaps & returns",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            icon: Lock,
            title: "Secure Payments",
            subtitle: "UPI, Cards & Razorpay Encrypted",
            color: "text-purple-500",
            bg: "bg-purple-50"
        }
    ];

    return (
        <div className="w-full my-8 md:my-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-50/80 rounded-3xl border border-slate-200/60 backdrop-blur-xs">
                {perks.map((perk, index) => {
                    const Icon = perk.icon;
                    return (
                        <div
                            key={index}
                            className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 p-3 rounded-2xl bg-white/70 border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-300"
                        >
                            <div className={`p-2.5 rounded-xl ${perk.bg} ${perk.color} shrink-0`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{perk.title}</h4>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{perk.subtitle}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TrustBar;
