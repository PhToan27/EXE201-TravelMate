import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Header from '../../components/common/Header';
import useTrip from '../../hooks/useTrip';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { formatDateRange, getDayCount } from '../../utils/dateUtils';
import { formatVND } from '../../utils/currencyUtils';

const { width } = Dimensions.get('window');

const ExportScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentTrip: trip } = useTrip();
  const [exporting, setExporting] = useState(false);

  if (!trip) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Không tìm thấy dữ liệu chuyến đi</Text>
      </View>
    );
  }

  const dayCount = getDayCount(trip.startDate, trip.endDate);

  const generateHTML = () => {
    const shareUrl = `https://exe201-travelmate.onrender.com/api/trips/shared/${trip.shareCode || ''}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`;

    // Build Day-by-Day itinerary HTML
    const byDay = {};
    (trip.activities || []).forEach((act) => {
      const d = act.day || 1;
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(act);
    });

    let itineraryHtml = '';
    for (let d = 1; d <= dayCount; d++) {
      const dayActivities = byDay[d] || [];
      const dayDate = new Date(trip.startDate);
      dayDate.setDate(dayDate.getDate() + d - 1);
      const displayDate = dayDate.toLocaleDateString('vi-VN');

      itineraryHtml += `
        <div class="day-section">
          <h3 class="day-title">Ngày ${d} (${displayDate})</h3>
          <div class="activity-timeline">
      `;

      if (dayActivities.length === 0) {
        itineraryHtml += `<p class="no-activity">Chưa có hoạt động nào được lên lịch.</p>`;
      } else {
        dayActivities.forEach((act) => {
          itineraryHtml += `
            <div class="activity-item">
              <div class="activity-time">${act.time || '08:00'}</div>
              <div class="activity-details">
                <div class="activity-location">${act.location || 'N/A'}</div>
                ${act.description ? `<div class="activity-desc">${act.description}</div>` : ''}
                <div class="activity-meta">
                  ${act.durationMinutes ? `<span>⏱ ${act.durationMinutes} phút</span>` : ''}
                  ${act.cost ? `<span>💰 ${formatVND(act.cost)}</span>` : ''}
                  ${act.transport ? `<span>🚗 Di chuyển: ${act.transport}</span>` : ''}
                </div>
              </div>
            </div>
          `;
        });
      }

      itineraryHtml += `
          </div>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 40px;
            line-height: 1.6;
            background-color: #ffffff;
          }
          
          /* Cover Page */
          .cover-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            border: 2px solid #e2e8f0;
            padding: 40px;
            margin-bottom: 60px;
            page-break-after: always;
            background: linear-gradient(135deg, #eff6ff 0%, #cffafe 100%);
          }
          .cover-logo {
            font-size: 48px;
            margin-bottom: 20px;
          }
          .cover-title {
            font-size: 32px;
            font-weight: 800;
            color: #1e3a8a;
            margin: 10px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .cover-subtitle {
            font-size: 20px;
            color: #4b5563;
            margin-bottom: 40px;
          }
          .cover-meta {
            margin-top: auto;
            border-top: 1px solid #cbd5e1;
            padding-top: 20px;
            width: 80%;
            display: flex;
            justify-content: space-around;
            font-size: 14px;
            color: #64748b;
          }
          
          /* Common Styles */
          h2.section-header {
            font-size: 20px;
            font-weight: 800;
            color: #1e3a8a;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 8px;
            margin-top: 40px;
            margin-bottom: 20px;
            text-transform: uppercase;
            page-break-before: auto;
          }
          
          /* Summary Table */
          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
          }
          .info-card h4 {
            margin: 0 0 10px 0;
            color: #475569;
            font-size: 14px;
            text-transform: uppercase;
          }
          .info-card p {
            margin: 4px 0;
            font-size: 15px;
            font-weight: 500;
          }
          
          /* Budget Breakdown */
          .budget-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .budget-table th, .budget-table td {
            border: 1px solid #e2e8f0;
            padding: 10px 12px;
            text-align: left;
            font-size: 14px;
          }
          .budget-table th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 700;
          }
          .budget-total {
            font-weight: 700;
            background-color: #eff6ff;
          }

          /* Day and Activities */
          .day-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .day-title {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            background-color: #f8fafc;
            padding: 8px 12px;
            border-left: 4px solid #3b82f6;
            margin-bottom: 15px;
          }
          .activity-timeline {
            border-left: 2px solid #e2e8f0;
            margin-left: 20px;
            padding-left: 20px;
          }
          .activity-item {
            position: relative;
            margin-bottom: 24px;
          }
          .activity-item::before {
            content: '';
            position: absolute;
            left: -27px;
            top: 4px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #3b82f6;
            border: 2px solid #ffffff;
          }
          .activity-time {
            font-weight: 700;
            font-size: 13px;
            color: #3b82f6;
            margin-bottom: 4px;
          }
          .activity-location {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
          }
          .activity-desc {
            font-size: 13px;
            color: #64748b;
            margin-top: 4px;
          }
          .activity-meta {
            margin-top: 6px;
            font-size: 11px;
            color: #94a3b8;
          }
          .activity-meta span {
            margin-right: 15px;
          }
          .no-activity {
            font-style: italic;
            color: #94a3b8;
          }

          /* QR Code Section */
          .qr-section {
            text-align: center;
            margin-top: 60px;
            padding: 20px;
            border-top: 1px dashed #cbd5e1;
            page-break-inside: avoid;
          }
          .qr-title {
            font-size: 14px;
            font-weight: 700;
            color: #475569;
            margin-bottom: 10px;
          }
          .qr-desc {
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
        <!-- Page 1: Cover -->
        <div class="cover-page">
          <div class="cover-logo">🧭</div>
          <div class="cover-title">SỔ TAY HÀNH TRÌNH DU LỊCH</div>
          <div class="cover-subtitle">${trip.destination}</div>
          <div class="cover-meta">
            <div><strong>Thời gian:</strong> ${formatDateRange(trip.startDate, trip.endDate)} (${dayCount} ngày)</div>
            <div><strong>Thành viên:</strong> ${trip.totalPeople || 1} người</div>
            <div><strong>Phong cách:</strong> ${trip.travelStyle || 'Tự do'}</div>
          </div>
        </div>

        <!-- Page 2: Summary & Budget -->
        <h2 class="section-header">Tổng Quan Chuyến Đi</h2>
        <div class="summary-grid">
          <div class="info-card">
            <h4>Thông tin cơ bản</h4>
            <p><strong>Điểm đến:</strong> ${trip.destination}</p>
            <p><strong>Loại chuyến đi:</strong> ${trip.tripType || 'Chưa chọn'}</p>
            <p><strong>Ngày khởi hành:</strong> ${new Date(trip.startDate).toLocaleDateString('vi-VN')}</p>
            <p><strong>Ngày kết thúc:</strong> ${new Date(trip.endDate).toLocaleDateString('vi-VN')}</p>
          </div>
          <div class="info-card">
            <h4>Gợi ý khách sạn</h4>
            ${trip.hotelRecommendation ? `
              <p><strong>Tên:</strong> ${trip.hotelRecommendation.name}</p>
              <p><strong>Khu vực:</strong> ${trip.hotelRecommendation.address}</p>
              <p><strong>Giá dự kiến/đêm:</strong> ${formatVND(trip.hotelRecommendation.estimatedCostPerNight)}</p>
            ` : '<p>Chưa có gợi ý lưu trú.</p>'}
          </div>
        </div>

        <h2 class="section-header">Phân Bổ Ngân Sách Ước Tính</h2>
        <table class="budget-table">
          <thead>
            <tr>
              <th>Danh mục chi phí</th>
              <th>Số tiền dự kiến (VND)</th>
            </tr>
          </thead>
          <tbody>
            ${trip.budgetBreakdown ? `
              <tr>
                <td>Lưu trú (Khách sạn)</td>
                <td>${formatVND(trip.budgetBreakdown.accommodation)}</td>
              </tr>
              <tr>
                <td>Ăn uống</td>
                <td>${formatVND(trip.budgetBreakdown.foodAndBeverage)}</td>
              </tr>
              <tr>
                <td>Hoạt động & Vé tham quan</td>
                <td>${formatVND(trip.budgetBreakdown.activitiesAndEntranceFees)}</td>
              </tr>
              <tr>
                <td>Di chuyển</td>
                <td>${formatVND(trip.budgetBreakdown.transportation)}</td>
              </tr>
              <tr>
                <td>Chi phí dự phòng</td>
                <td>${formatVND(trip.budgetBreakdown.unforeseenExpenses)}</td>
              </tr>
            ` : `
              <tr>
                <td colspan="2" style="text-align: center; color: #94a3b8; font-style: italic;">Chưa có phân bổ chi phí</td>
              </tr>
            `}
            <tr class="budget-total">
              <td>Tổng ngân sách của bạn</td>
              <td>${formatVND(trip.budget)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Page 3+: Itinerary Details -->
        <h2 class="section-header">Chi Tiết Lịch Trình Từng Ngày</h2>
        ${itineraryHtml}

        <!-- QR Map Link Section -->
        <div class="qr-section">
          <div class="qr-title">BẢN ĐỒ & CHIA SẺ HÀNH TRÌNH</div>
          <div class="qr-desc">Quét mã QR dưới đây để xem bản đồ lộ trình chi tiết và chia sẻ hành trình trực tuyến trên ứng dụng TravelMate</div>
          <img src="${qrCodeUrl}" alt="Mã QR bản đồ hành trình" />
        </div>
      </body>
      </html>
    `;
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const htmlContent = generateHTML();
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      if (uri) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Xuất lịch trình ${trip.destination}`,
          UTI: 'com.adobe.pdf'
        });
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Lỗi', 'Không thể tạo file PDF. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

  const handleShareLink = async () => {
    try {
      const shareUrl = `https://exe201-travelmate.onrender.com/api/trips/shared/${trip.shareCode || ''}`;
      await Sharing.shareAsync(shareUrl, {
        dialogTitle: 'Chia sẻ lịch trình trực tuyến'
      });
    } catch (error) {
      console.error('Error sharing link:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Xuất lịch trình"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Preview Card */}
        <View style={styles.previewCard}>
          <LinearGradient
            colors={['#3B82F6', '#06B6D4']}
            style={styles.previewHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="document-text" size={32} color={COLORS.white} />
            <Text style={styles.previewTitle}>Sổ tay du lịch TravelMate</Text>
            <Text style={styles.previewDest}>{trip.destination}</Text>
          </LinearGradient>

          <View style={styles.previewBody}>
            <PreviewRow label="Thời gian" value={`${formatDateRange(trip.startDate, trip.endDate)} (${dayCount} ngày)`} />
            <PreviewRow label="Số thành viên" value={`${trip.totalPeople || 1} người`} />
            <PreviewRow label="Loại chuyến đi" value={trip.tripType || 'Solo'} />
            <PreviewRow label="Tổng ngân sách" value={formatVND(trip.budget)} />
            <PreviewRow label="Gợi ý khách sạn" value={trip.hotelRecommendation?.name || 'Không có'} />
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleExportPDF}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={20} color={COLORS.white} />
              <Text style={styles.exportBtnText}>Xuất Sổ Tay Du Lịch PDF</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareBtn}
          activeOpacity={0.85}
          onPress={handleShareLink}
        >
          <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
          <Text style={styles.shareBtnText}>Chia sẻ liên kết trực tuyến</Text>
        </TouchableOpacity>

        {/* Help block */}
        <View style={styles.helpCard}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.gray[500]} />
          <Text style={styles.helpText}>
            File PDF bao gồm Trang bìa nghệ thuật, Tóm tắt chuyến đi, Chi tiết phân bổ ngân sách AI, Lịch trình từng ngày và một mã QR quét liên kết xem trực tuyến.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const PreviewRow = ({ label, value }) => (
  <View style={styles.previewRow}>
    <Text style={styles.previewLabel}>{label}</Text>
    <Text style={styles.previewVal} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, gap: SPACING.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  errorText: { marginTop: 12, fontSize: 14, color: COLORS.gray[500] },
  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  previewHeader: {
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 8,
  },
  previewTitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  previewDest: { fontSize: 24, color: COLORS.white, fontWeight: '900' },
  previewBody: { padding: SPACING.md, gap: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.gray[100], paddingBottom: 10 },
  previewLabel: { fontSize: 13, color: COLORS.gray[500], fontWeight: '500' },
  previewVal: { fontSize: 13, color: COLORS.black, fontWeight: '700' },
  exportBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: 52,
    borderRadius: RADIUS.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  exportBtnDisabled: { opacity: 0.8 },
  exportBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
  shareBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
  },
  shareBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '800' },
  helpCard: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingVertical: 4 },
  helpText: { flex: 1, fontSize: 12, color: COLORS.gray[500], lineHeight: 17 },
});

export default ExportScreen;
