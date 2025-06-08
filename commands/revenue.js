const { getChatInfo } = require('../utils/chatUtils');
const { getAllGroupsSettings, isBotOwner } = require('../utils/groupSettings');

/**
 * Command untuk melihat statistik pendapatan (BOT_OWNER only)
 * Usage: !revenue
 */
module.exports = async (client, message) => {
    try {
        const chatInfo = await getChatInfo(client, message);
        
        // Check if user is bot owner
        if (!isBotOwner(chatInfo.contact)) {
            await message.reply(
                '❌ *Akses Ditolak*\n\n' +
                'Hanya BOT_OWNER yang dapat melihat statistik pendapatan.\n\n' +
                '**Info:**\n' +
                '• Command ini memerlukan akses BOT_OWNER\n' +
                '• Data pendapatan bersifat rahasia\n' +
                '• Hubungi owner bot untuk informasi lebih lanjut'
            );
            return;
        }
        
        const allSettings = getAllGroupsSettings();
        const now = new Date();
        
        let activeRevenue = 0;
        let totalRevenue = 0;
        let activeGroups = 0;
        let totalPaidGroups = 0;
        let trialGroups = 0;
        let expiredGroups = 0;
        
        const revenueByPackage = {
            '1': { count: 0, revenue: 0, name: '1 Hari' },
            '7': { count: 0, revenue: 0, name: '1 Minggu' },
            '30': { count: 0, revenue: 0, name: '1 Bulan' },
            '180': { count: 0, revenue: 0, name: '6 Bulan' },
            '365': { count: 0, revenue: 0, name: '1 Tahun' },
            'custom': { count: 0, revenue: 0, name: 'Custom' }
        };
        
        const monthlyRevenue = {};
        
        // Analyze all groups
        for (const [groupId, settings] of Object.entries(allSettings)) {
            if (settings.rentMode && settings.rentExpiry && settings.rentPrice !== undefined) {
                const expiryDate = new Date(settings.rentExpiry);
                const isActive = now < expiryDate;
                const isTrial = settings.rentOwner && settings.rentOwner.id === 'trial@trial.com';
                const price = settings.rentPrice || 0;
                
                if (isTrial) {
                    trialGroups++;
                } else {
                    totalPaidGroups++;
                    totalRevenue += price;
                    
                    if (isActive) {
                        activeGroups++;
                        activeRevenue += price;
                    } else {
                        expiredGroups++;
                    }
                    
                    // Categorize by package
                    const duration = settings.rentDuration || 0;
                    let packageKey = 'custom';
                    
                    if (duration === 1) packageKey = '1';
                    else if (duration === 7) packageKey = '7';
                    else if (duration === 30) packageKey = '30';
                    else if (duration === 180) packageKey = '180';
                    else if (duration === 365) packageKey = '365';
                    
                    revenueByPackage[packageKey].count++;
                    revenueByPackage[packageKey].revenue += price;
                    
                    // Monthly revenue (based on activation date)
                    if (settings.rentActivatedAt) {
                        const activationDate = new Date(settings.rentActivatedAt);
                        const monthKey = `${activationDate.getFullYear()}-${String(activationDate.getMonth() + 1).padStart(2, '0')}`;
                        
                        if (!monthlyRevenue[monthKey]) {
                            monthlyRevenue[monthKey] = 0;
                        }
                        monthlyRevenue[monthKey] += price;
                    }
                }
            }
        }
        
        // Build revenue report
        let revenueReport = '💰 *Laporan Pendapatan Bot*\n\n';
        
        // Summary
        revenueReport += '📊 *Ringkasan Pendapatan:*\n';
        revenueReport += `• Pendapatan Aktif: Rp ${activeRevenue.toLocaleString('id-ID')}\n`;
        revenueReport += `• Total Pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}\n`;
        revenueReport += `• Rata-rata per Grup: Rp ${totalPaidGroups > 0 ? Math.round(totalRevenue / totalPaidGroups).toLocaleString('id-ID') : '0'}\n\n`;
        
        // Group statistics
        revenueReport += '📈 *Statistik Grup:*\n';
        revenueReport += `• Grup Aktif Berbayar: ${activeGroups}\n`;
        revenueReport += `• Grup Trial Aktif: ${trialGroups}\n`;
        revenueReport += `• Grup Expired: ${expiredGroups}\n`;
        revenueReport += `• Total Grup Berbayar: ${totalPaidGroups}\n\n`;
        
        // Revenue by package
        revenueReport += '📦 *Pendapatan per Paket:*\n';
        for (const [key, data] of Object.entries(revenueByPackage)) {
            if (data.count > 0) {
                revenueReport += `• ${data.name}: ${data.count} grup - Rp ${data.revenue.toLocaleString('id-ID')}\n`;
            }
        }
        revenueReport += '\n';
        
        // Monthly revenue (last 6 months)
        const sortedMonths = Object.keys(monthlyRevenue).sort().slice(-6);
        if (sortedMonths.length > 0) {
            revenueReport += '📅 *Pendapatan Bulanan (6 Bulan Terakhir):*\n';
            sortedMonths.forEach(month => {
                const [year, monthNum] = month.split('-');
                const monthName = new Date(year, monthNum - 1).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
                revenueReport += `• ${monthName}: Rp ${monthlyRevenue[month].toLocaleString('id-ID')}\n`;
            });
            revenueReport += '\n';
        }
        
        // Performance metrics
        const conversionRate = totalPaidGroups > 0 ? ((totalPaidGroups / (totalPaidGroups + trialGroups)) * 100).toFixed(1) : '0';
        const retentionRate = totalPaidGroups > 0 ? ((activeGroups / totalPaidGroups) * 100).toFixed(1) : '0';
        
        revenueReport += '📊 *Metrik Performa:*\n';
        revenueReport += `• Conversion Rate: ${conversionRate}% (Trial → Berbayar)\n`;
        revenueReport += `• Retention Rate: ${retentionRate}% (Aktif dari Total)\n`;
        revenueReport += `• Churn Rate: ${(100 - parseFloat(retentionRate)).toFixed(1)}% (Expired)\n\n`;
        
        // Projections
        if (activeGroups > 0 && activeRevenue > 0) {
            const avgRevenuePerGroup = activeRevenue / activeGroups;
            const projectedMonthly = avgRevenuePerGroup * activeGroups;
            
            revenueReport += '🔮 *Proyeksi Pendapatan:*\n';
            revenueReport += `• Rata-rata per Grup Aktif: Rp ${Math.round(avgRevenuePerGroup).toLocaleString('id-ID')}\n`;
            revenueReport += `• Proyeksi Bulanan: Rp ${Math.round(projectedMonthly).toLocaleString('id-ID')}\n`;
            revenueReport += `• Proyeksi Tahunan: Rp ${Math.round(projectedMonthly * 12).toLocaleString('id-ID')}\n\n`;
        }
        
        // Recommendations
        revenueReport += '💡 *Rekomendasi:*\n';
        if (expiredGroups > activeGroups) {
            revenueReport += '• Fokus pada retensi pelanggan\n';
            revenueReport += '• Tingkatkan reminder perpanjangan\n';
        }
        if (trialGroups > totalPaidGroups) {
            revenueReport += '• Tingkatkan konversi trial ke berbayar\n';
            revenueReport += '• Berikan insentif perpanjangan\n';
        }
        if (revenueByPackage['1'].count > revenueByPackage['30'].count) {
            revenueReport += '• Promosikan paket jangka panjang\n';
            revenueReport += '• Berikan diskon untuk paket bulanan\n';
        }
        
        revenueReport += '\n📱 *Data diperbarui real-time*\n';
        revenueReport += `*Generated: ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}*`;
        
        await message.reply(revenueReport);
        
    } catch (error) {
        console.error('Error in revenue command:', error);
        await message.reply('Terjadi error saat mengambil data pendapatan.');
    }
};
