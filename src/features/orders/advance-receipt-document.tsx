import 'server-only';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 38,
    paddingBottom: 50,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#ea580c',
    paddingBottom: 14,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#9a3412',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 3,
  },
  receiptBadgeContainer: {
    alignItems: 'flex-end',
  },
  receiptBadge: {
    backgroundColor: '#ffedd5',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  receiptBadgeText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#c2410c',
    textTransform: 'uppercase',
  },
  receiptMetaText: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'right',
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  metaBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
  },
  metaHeading: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  metaLine: {
    fontSize: 9,
    color: '#334155',
    marginBottom: 3,
  },
  metaBold: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  colDesc: { width: '45%' },
  colMode: { width: '20%', textAlign: 'center' },
  colRef: { width: '20%', textAlign: 'center' },
  colAmount: { width: '15%', textAlign: 'right' },
  summaryContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  termsBox: {
    width: '52%',
    paddingRight: 10,
  },
  termsHeading: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  termsText: {
    fontSize: 7.5,
    color: '#64748b',
    lineHeight: 1.4,
  },
  summaryCard: {
    width: '44%',
    backgroundColor: '#fffaf5',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 6,
    padding: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    fontSize: 8.5,
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#fdba74',
    marginTop: 4,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  signatureBox: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureLine: {
    width: 180,
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    paddingTop: 6,
    textAlign: 'center',
    fontSize: 8,
    color: '#64748b',
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 38,
    right: 38,
    fontSize: 7.5,
    textAlign: 'center',
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 6,
  },
});

export interface AdvanceReceiptData {
  order: {
    id: string;
    name: string;
    status: string;
    total_minor: number;
    created_at: string;
  };
  customer?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  } | null;
  payment: {
    id: string;
    amount_minor: number;
    mode: string;
    reference?: string | null;
    created_at: string;
  };
  totalPaidMinor: number;
  balanceDueMinor: number;
}

function formatInr(minor: number): string {
  return 'INR ' + (minor / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function modeLabel(mode: string): string {
  switch (mode.toLowerCase()) {
    case 'cash':
      return 'Cash / नकद';
    case 'upi':
      return 'UPI / QR';
    case 'bank':
      return 'Bank Transfer';
    case 'cheque':
      return 'Cheque / डीडी';
    default:
      return mode.toUpperCase();
  }
}

export async function advanceReceiptPdf(data: AdvanceReceiptData): Promise<Buffer> {
  const { order, customer, payment, totalPaidMinor, balanceDueMinor } = data;
  const receiptNo = `GW-ADV-${order.id.slice(0, 8).toUpperCase()}-${payment.id.slice(0, 4).toUpperCase()}`;
  const paymentDate = new Date(payment.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return renderToBuffer(
    <Document title={`Payment Receipt - ${order.name} (${receiptNo})`}>
      <Page size="A4" style={styles.page}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>GateWala Fabrication</Text>
            <Text style={styles.brandSubtitle}>
              Welding &amp; Architectural Metal Fabrication Works
            </Text>
            <Text style={styles.brandSubtitle}>
              Gates · Grills · Railings · Sheds · Custom Steelwork
            </Text>
          </View>
          <View style={styles.receiptBadgeContainer}>
            <View style={styles.receiptBadge}>
              <Text style={styles.receiptBadgeText}>Customer Payment Receipt</Text>
            </View>
            <Text style={styles.receiptMetaText}>Receipt No: {receiptNo}</Text>
            <Text style={styles.receiptMetaText}>Date: {paymentDate}</Text>
          </View>
        </View>

        {/* Customer & Order Details Meta Grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaBox}>
            <Text style={styles.metaHeading}>Customer Details (ग्राहक का विवरण)</Text>
            <Text style={[styles.metaLine, styles.metaBold]}>
              {customer?.name || 'Valued Customer'}
            </Text>
            {Boolean(customer?.phone) && (
              <Text style={styles.metaLine}>Mobile: {customer?.phone}</Text>
            )}
            {Boolean(customer?.email) && (
              <Text style={styles.metaLine}>Email: {customer?.email}</Text>
            )}
            {Boolean(customer?.address) && (
              <Text style={styles.metaLine}>Site Address: {customer?.address}</Text>
            )}
          </View>

          <View style={styles.metaBox}>
            <Text style={styles.metaHeading}>Order Details (ऑर्डर विवरण)</Text>
            <Text style={[styles.metaLine, styles.metaBold]}>{order.name}</Text>
            <Text style={styles.metaLine}>Order ID: {order.id}</Text>
            <Text style={styles.metaLine}>
              Current Stage: {order.status.replaceAll('_', ' ')}
            </Text>
            <Text style={styles.metaLine}>
              Booked Date: {new Date(order.created_at).toLocaleDateString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Payment Line Item Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Transaction Description</Text>
            <Text style={styles.colMode}>Payment Mode</Text>
            <Text style={styles.colRef}>Reference / UTR</Text>
            <Text style={styles.colAmount}>Amount Paid</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>
              Payment received against order {order.name}
            </Text>
            <Text style={styles.colMode}>{modeLabel(payment.mode)}</Text>
            <Text style={styles.colRef}>{payment.reference || 'N/A'}</Text>
            <Text style={[styles.colAmount, styles.metaBold]}>
              {formatInr(payment.amount_minor)}
            </Text>
          </View>
        </View>

        {/* Financial Summary & Terms */}
        <View style={styles.summaryContainer}>
          <View style={styles.termsBox}>
            <Text style={styles.termsHeading}>Terms &amp; Acknowledgement / शर्तें एवं पुष्टि</Text>
            <Text style={styles.termsText}>
              1. This is a computer-generated receipt for an advance, partial or final payment against a fabrication order.
            </Text>
            <Text style={styles.termsText}>
              2. The receipt records money received; the order progress and outstanding balance are tracked separately.
            </Text>
            <Text style={styles.termsText}>
              3. The remaining balance amount ({formatInr(balanceDueMinor)}) is payable upon delivery and installation sign-off.
            </Text>
            <Text style={styles.termsText}>
              4. Payment records are cryptographically verified and immutable in the GateWala system.
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#475569' }}>Total Order Value:</Text>
              <Text style={styles.metaBold}>{formatInr(order.total_minor)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#c2410c' }}>Current Receipt:</Text>
              <Text style={[styles.metaBold, { color: '#c2410c' }]}>
                {formatInr(payment.amount_minor)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#15803d' }}>Total Payment Received:</Text>
              <Text style={[styles.metaBold, { color: '#15803d' }]}>
                {formatInr(totalPaidMinor)}
              </Text>
            </View>
            <View style={styles.summaryTotalRow}>
              <Text style={{ color: '#0f172a' }}>Balance Due (शेष):</Text>
              <Text style={{ color: balanceDueMinor > 0 ? '#b91c1c' : '#15803d' }}>
                {formatInr(balanceDueMinor)}
              </Text>
            </View>
          </View>
        </View>

        {/* Signature Box */}
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine}>
            <Text>Customer Acknowledgement</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text>For GateWala Fabrication Works</Text>
            <Text style={{ fontSize: 7, color: '#94a3b8', marginTop: 2 }}>
              Authorized Signatory
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          GateWala Fabrication Works · Contact: +91 96918 84978 · https://smartfabrication.vercel.app
        </Text>
      </Page>
    </Document>
  );
}
