# SmartFabrication — Customer UX & Mobile Usability Specification

## 1. Audience Demographics & Behavioral Context

- **Primary Device**: Budget to mid-range Android smartphones (screen widths 360px–412px).
- **Network Environment**: 4G/3G mobile data with occasional high latency or packet loss.
- **Literacy & Comfort**: High visual comprehension; comfortable with conversational Hindi and basic English loanwords; intimidated by long blocks of English jargon or complex nested menus.

---

## 2. Key UX Principles Implemented

### 2.1 Language Switcher
- **Header Visibility**: Directly visible next to navigation and quote actions: `हिंदी | English`.
- **Zero Loss of Form State**:
  - When a customer is halfway through entering dimensions on `/estimate` or filling their phone number on `/contact`, clicking `हिंदी` or `English` triggers an in-memory locale context update.
  - The DOM elements remain mounted; inputs keep their entered values.
  - No page reload, no scroll reset, no lost work.
- **Persistence**: Saved in cookies (`sf_locale`) and local storage for returning visits.

### 2.2 Product Catalog & Search
- **Bilingual Titles**:
  - In Hindi mode: `"लोहे का मेन गेट (Iron Main Gate)"` with clear starting prices in Indian Rupees (`₹`).
  - In English mode: `"Iron Main Gate"`.
- **Search Query Flexibility**:
  - A user typing `"गेट"`, `"लोहा"`, `"स्टील"`, `"जाली"`, `"रेलिंग"` or `"gate"`, `"grill"`, `"railing"` will find matching designs without failure.
- **Card Action Ergonomics**:
  - High-contrast, large touch targets (minimum 44×44px for buttons).
  - Clear floating heart (Wishlist) and quick Add to Cart.

### 2.3 Price Calculator (`/estimate`)
- **Default Unit**: Feet + Inches (`ft_in`).
  - Village customers almost exclusively talk in Feet (e.g., "10 फीट चौड़ा और 7 फीट ऊँचा गेट").
  - The form immediately presents Feet and Inch boxes with clear examples.
  - Users can still toggle to `mm` or `m` with one tap if required.
- **Conversational Prompts**:
  - "गेट की चौड़ाई कितनी है? (फीट और इंच)"
  - "गेट की ऊँचाई कितनी है? (फीट और इंच)"
  - Clear notice: "यह केवल अनुमानित कीमत है। कारीगर द्वारा घर पर नाप लेने के बाद पक्की कीमत तय होगी।"

### 2.4 Enquiry & WhatsApp Handoff (`/contact`)
- Simple fields:
  1. आपका नाम (Your name)
  2. मोबाइल / WhatsApp नंबर (Mobile number)
  3. गाँव / शहर का नाम (Village / City)
  4. क्या काम करवाना है? (What do you need fabricated?)
  5. फोटो भेजें (Optional reference photo)
- Direct WhatsApp action with pre-structured message so users don't have to type extensive messages on a mobile keyboard.
