import 'server-only';
import { quotationTotals } from '@/contracts/quotation';
import { roundedQuoteLine } from '@/contracts/workflows';
import { Document,Page,Text,View,StyleSheet,renderToBuffer } from '@react-pdf/renderer';
const styles=StyleSheet.create({
 page:{paddingTop:38,paddingHorizontal:38,paddingBottom:58,fontSize:9,fontFamily:'Helvetica',color:'#17202e'},
 title:{fontSize:21,marginBottom:8},small:{fontSize:9,color:'#64748b',marginBottom:16},
 row:{flexDirection:'row',alignItems:'flex-start',borderBottomWidth:1,borderBottomColor:'#e2e8f0',paddingVertical:9},
 heading:{backgroundColor:'#f1f5f9',fontFamily:'Helvetica-Bold'},
 description:{width:'46%',flexShrink:0,paddingRight:12},quantity:{width:'10%',flexShrink:0,textAlign:'right',paddingRight:8},rate:{width:'22%',flexShrink:0,textAlign:'right',paddingRight:10},amount:{width:'22%',flexShrink:0,textAlign:'right'},
 summary:{width:'58%',alignSelf:'flex-end',marginTop:14},summaryRow:{flexDirection:'row',paddingVertical:5},summaryLabel:{width:'55%',paddingRight:10,textAlign:'right'},summaryValue:{width:'45%',textAlign:'right'},total:{borderTopWidth:1,borderTopColor:'#94a3b8',marginTop:5,paddingTop:10,fontFamily:'Helvetica-Bold',fontSize:11},
 notice:{fontSize:8,color:'#64748b',marginTop:24,lineHeight:1.5},footer:{position:'absolute',bottom:25,left:38,right:38,fontSize:8,textAlign:'right',color:'#64748b'}
});
type Snapshot={items:{description:string;quantity:number;unit_minor:number}[];subtotal_minor:number;discount_minor:number;tax_bps:number;total_minor:number};
export async function quotationPdf(quote:{name:string;status:string;expires_at:string},version:{version:number;snapshot:Snapshot;total_minor:number}){
 const totals=quotationTotals(version.snapshot),rupees=(value:number)=>'INR '+(value/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
 return renderToBuffer(<Document title={quote.name}><Page size="A4" style={styles.page}>
 <Text style={styles.title}>GateWala - Welding &amp; Fabrication Works</Text><Text style={styles.small}>QUOTATION | Version {version.version} | {quote.status.toUpperCase()}</Text><Text style={styles.title}>{quote.name}</Text><Text style={styles.small}>Valid until {new Date(quote.expires_at).toISOString().slice(0,10)}</Text>
 <View style={[styles.row,styles.heading]} minPresenceAhead={35}><Text style={styles.description}>Description</Text><Text style={styles.quantity}>Qty</Text><Text style={styles.rate}>Unit rate</Text><Text style={styles.amount}>Amount</Text></View>
 {version.snapshot.items.map((line,index)=><View key={index} style={styles.row} wrap={false}><Text style={styles.description}>{line.description}</Text><Text style={styles.quantity}>{line.quantity}</Text><Text style={styles.rate}>{rupees(line.unit_minor)}</Text><Text style={styles.amount}>{rupees(roundedQuoteLine(line.quantity,line.unit_minor))}</Text></View>)}
 <View style={styles.summary} wrap={false}>{[['Subtotal',totals.subtotal_minor],['Discount',-totals.discount_minor],['Tax ('+version.snapshot.tax_bps/100+'%)',totals.tax_minor],['Total (INR)',version.total_minor]].map(([label,value],index)=><View key={label} style={index===3?[styles.summaryRow,styles.total]:styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{rupees(Number(value))}</Text></View>)}</View>
 <Text style={styles.notice}>Currency: INR. This document reflects the immutable quotation version indicated above. It is not a tax invoice. Dimensions, scope and terms must be confirmed with the workshop.</Text><Text fixed style={styles.footer} render={({pageNumber,totalPages})=>'Page '+pageNumber+' / '+totalPages}/>
 </Page></Document>);
}
