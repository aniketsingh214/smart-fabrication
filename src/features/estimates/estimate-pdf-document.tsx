import 'server-only';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingHorizontal: 36,
    paddingBottom: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#ffffff'
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#ea580c',
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#9a3412',
    letterSpacing: 0.5
  },
  brandSubtitle: {
    fontSize: 8.5,
    color: '#64748b',
    marginTop: 3
  },
  estimateBadge: {
    backgroundColor: '#ffedd5',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'flex-end'
  },
  estimateBadgeText: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#c2410c',
    textTransform: 'uppercase'
  },
  estimateMetaText: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 3,
    textAlign: 'right'
  },
  heroBox: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  heroLabel: {
    fontSize: 9,
    color: '#9a3412',
    fontFamily: 'Helvetica-Bold'
  },
  heroProduct: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginTop: 2
  },
  heroPrice: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#ea580c'
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  card: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10
  },
  cardTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2.5
  },
  label: {
    color: '#64748b',
    fontSize: 8
  },
  value: {
    color: '#0f172a',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold'
  },
  table: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 14,
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontFamily: 'Helvetica-Bold'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 5.5,
    paddingHorizontal: 8
  },
  colMaterial: { width: '50%', fontSize: 8 },
  colQty: { width: '25%', textAlign: 'right', fontSize: 8 },
  colAmt: { width: '25%', textAlign: 'right', fontSize: 8 },
  disclaimerBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 16
  },
  disclaimerTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    marginBottom: 3
  },
  disclaimerText: {
    fontSize: 7.5,
    color: '#64748b',
    lineHeight: 1.35
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerText: {
    fontSize: 7.5,
    color: '#94a3b8'
  },
  contactText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ea580c'
  }
});

export interface EstimatePdfData {
  productName: string;
  widthMm: number;
  heightMm: number;
  widthFtIn: string;
  heightFtIn: string;
  areaSqFt: string;
  areaSqM: string;
  weightKg: number;
  minMinor: number;
  maxMinor: number;
  materials: {
    name: string;
    quantity: number;
    unit: string;
    amount_minor: number;
  }[];
  notice?: string;
  phone?: string;
  whatsapp?: string;
}

const formatRupees = (minor: number) =>
  'INR ' + (minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export async function estimatePdf(data: EstimatePdfData) {
  const estimateId = `EST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return renderToBuffer(
    <Document title={`GateWala-Estimate-${data.productName}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>GateWala — Steel &amp; Fabrication Works</Text>
            <Text style={styles.brandSubtitle}>High-Precision Gates, Railings, Grills &amp; Custom Metalwork</Text>
          </View>
          <View style={styles.estimateBadge}>
            <Text style={styles.estimateBadgeText}>Estimated Price Sheet</Text>
            <Text style={styles.estimateMetaText}>{estimateId} · {dateStr}</Text>
          </View>
        </View>

        {/* Hero Price & Product Banner */}
        <View style={styles.heroBox}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.heroLabel}>PROJECT DESIGN / डिज़ाइन</Text>
            <Text style={styles.heroProduct}>{data.productName}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.heroLabel}>ESTIMATED PRICE RANGE</Text>
            <Text style={styles.heroPrice}>
              {formatRupees(data.minMinor)} – {formatRupees(data.maxMinor)}
            </Text>
          </View>
        </View>

        {/* 2-Column Info Grid */}
        <View style={styles.grid}>
          {/* Column 1: Dimensions */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dimensions &amp; Sizing / नाप</Text>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Metric (Width × Height):</Text>
              <Text style={styles.value}>{data.widthMm} mm × {data.heightMm} mm</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Feet &amp; Inches:</Text>
              <Text style={styles.value}>{data.widthFtIn} × {data.heightFtIn}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Total Area:</Text>
              <Text style={styles.value}>{data.areaSqFt} sq. ft. ({data.areaSqM} m²)</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Approximate Weight:</Text>
              <Text style={styles.value}>{data.weightKg} kg (approx)</Text>
            </View>
          </View>

          {/* Column 2: Workshop Specifications */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Standard Inclusions / शामिल कार्य</Text>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Welding &amp; Joints:</Text>
              <Text style={styles.value}>Tack &amp; Full Strength Weld</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Rust Protection:</Text>
              <Text style={styles.value}>Red Oxide Primer Coat</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Site Measurement:</Text>
              <Text style={styles.value}>Free workshop visit</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Making Time:</Text>
              <Text style={styles.value}>7 – 14 Days</Text>
            </View>
          </View>
        </View>

        {/* Material & Cost Breakdown Table */}
        <Text style={[styles.cardTitle, { marginBottom: 6 }]}>
          Estimated Material Breakdown / अनुमानित मटीरियल विवरण
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colMaterial}>Material Item</Text>
            <Text style={styles.colQty}>Quantity</Text>
            <Text style={styles.colAmt}>Estimated Cost</Text>
          </View>
          {data.materials.length > 0 ? (
            data.materials.map((m, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colMaterial}>{m.name}</Text>
                <Text style={styles.colQty}>{m.quantity} {m.unit}</Text>
                <Text style={styles.colAmt}>{formatRupees(m.amount_minor)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={styles.colMaterial}>Standard Structural Steel (MS / SS) &amp; Labor</Text>
              <Text style={styles.colQty}>{data.areaSqFt} sq. ft.</Text>
              <Text style={styles.colAmt}>{formatRupees(data.minMinor)}</Text>
            </View>
          )}
        </View>

        {/* Disclaimer / Next Steps */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>IMPORTANT NOTICE &amp; NEXT STEPS / ज़रूरी सूचना:</Text>
          <Text style={styles.disclaimerText}>
            1. This document is a quick price estimate based on current steel rates and standard workshop sizes.
          </Text>
          <Text style={styles.disclaimerText}>
            2. Final exact price will be confirmed when our workshop team visits your site to check measurements and wall alignment.
          </Text>
          <Text style={styles.disclaimerText}>
            3. Call or WhatsApp our workshop to book a site measurement visit or discuss custom designs.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerText}>GateWala Fabrication · smartfabrication.vercel.app</Text>
            <Text style={styles.footerText}>Quality Craftsmanship · Heavy-Duty Steel Gates</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.contactText}>Call / WhatsApp: {data.whatsapp || '+91 98765 43210'}</Text>
            <Text style={styles.footerText}>Direct Workshop Enquiry Support</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
