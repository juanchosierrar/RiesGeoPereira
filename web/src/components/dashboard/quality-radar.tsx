"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
    { subject: 'Posicional', DIGER: 95, DesInventar: 80, Emergencias98: 60, fullMark: 100 },
    { subject: 'Temática', DIGER: 98, DesInventar: 85, Emergencias98: 40, fullMark: 100 },
    { subject: 'Lógica', DIGER: 86, DesInventar: 70, Emergencias98: 55, fullMark: 100 },
    { subject: 'Temporal', DIGER: 99, DesInventar: 60, Emergencias98: 30, fullMark: 100 },
    { subject: 'Completitud', DIGER: 85, DesInventar: 75, Emergencias98: 20, fullMark: 100 },
];

export default function QualityRadarChart() {
    return (
        <div className="w-full h-[220px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
                    <PolarGrid stroke="#1B365D30" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="DIGER" dataKey="DIGER" stroke="#1B365D" fill="#1B365D" fillOpacity={0.45} />
                    <Radar name="DesInventar" dataKey="DesInventar" stroke="#F57C00" fill="#F57C00" fillOpacity={0.35} />
                    <Radar name="Emergencias 98" dataKey="Emergencias98" stroke="#D32F2F" fill="#D32F2F" fillOpacity={0.25} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#1B365D30', borderRadius: '8px', color: '#1a1a2e', fontSize: 12 }}
                        itemStyle={{ color: '#1a1a2e' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#64748b' }} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
