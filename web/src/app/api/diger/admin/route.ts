import { NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';

const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_API_KEY!
});

/**
 * DELETE: Vaciar completamente la tabla datos_diger
 * Solo para uso administrativo / desarrollo
 */
export async function DELETE() {
    try {
        // Fetch all IDs first then delete in batch
        const { data: allRecords, error: fetchError } = await insforge.database
            .from('datos_diger')
            .select('fid')
            .limit(5000);

        if (fetchError) throw fetchError;

        if (!allRecords || allRecords.length === 0) {
            return NextResponse.json({ success: true, deleted: 0, message: 'Tabla ya estaba vacía' });
        }

        const fids = allRecords.map((r: any) => r.fid).filter(Boolean);

        // Delete all records
        const { error: deleteError } = await insforge.database
            .from('datos_diger')
            .delete()
            .in('fid', fids);

        if (deleteError) throw deleteError;

        return NextResponse.json({
            success: true,
            deleted: fids.length,
            message: `✅ Se eliminaron ${fids.length} registros. La tabla está vacía.`
        });

    } catch (error: any) {
        console.error('Error clearing datos_diger:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Error al limpiar la tabla'
        }, { status: 500 });
    }
}

/**
 * GET: Contar registros actuales
 */
export async function GET() {
    try {
        const { data, error } = await insforge.database
            .from('datos_diger')
            .select('fid')
            .limit(10000);

        if (error) throw error;

        return NextResponse.json({
            count: data?.length || 0,
            message: `La tabla tiene ${data?.length || 0} registros`
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
