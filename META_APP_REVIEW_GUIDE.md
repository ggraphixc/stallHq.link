# Meta App Review Submission Guide — Instagram Content Publishing

## Why App Review is Required

Your Facebook App (ID: `1687087632336203`) currently has `instagram_content_publish` permission in **Development Mode**. This means:
- The API accepts requests and returns media IDs
- But content is **silently not published** to Instagram
- Only explicitly added test users can authenticate

To publish to live Instagram accounts, you need **Advanced Access** via Meta App Review.

---

## Prerequisites Checklist

Before submitting, verify these are all in place:

- [x] Facebook App created (ID: `1687087632336203`)
- [x] Instagram Business Account linked (ID: `17841452657298939`)
- [x] Facebook Page linked (Zerupthcodes, ID: `1145498245321449`)
- [x] System user token with `instagram_content_publish` permission
- [ ] **Privacy Policy URL** — must be live and accessible (you have `/privacy`)
- [ ] **Data Deletion URL** — must be configured in App Settings → Basic
- [ ] **App icon** — 1024×1024px uploaded
- [ ] **App description** — filled in App Settings → Basic
- [ ] **Contact email** — filled in App Settings → Basic

---

## Step-by-Step Submission Process

### Step 1: Configure App Settings

1. Go to [Meta Developer Dashboard](https://developers.facebook.com/apps/1687087632336203/settings/basic/)
2. Fill in:
   - **App Name:** StallHq
   - **App ID:** 1687087632336203
   - **Contact Email:** your email
   - **App Icon:** Upload 1024×1024 logo
   - **Description:** "StallHq is an e-commerce platform that enables vendors to create online stores and automatically post product promotions to WhatsApp and Instagram."
   - **Privacy Policy URL:** `https://stallhq.com/privacy`
   - **Data Deletion Instructions URL:** `https://stallhq.com/privacy#data-deletion` (or your actual deletion endpoint)

### Step 2: Set App Use Case

1. Go to **App Review** → **Permissions and Features**
2. Find `instagram_content_publish` (or `instagram_content_publishing` for Facebook Login)
3. Click **Request Advanced Access**
4. Select your use case: **"Tech Provider"** — your app serves multiple businesses (vendors)

### Step 3: Complete the Submission Form

#### Use Case Description (Copy this):

```
StallHq is an e-commerce platform that allows vendors to create online stores and 
automatically post product promotions to their Instagram Business accounts.

How instagram_content_publish is used:
1. Vendor creates a product in their StallHq store
2. Vendor enables "Auto-post to Instagram" in their store settings
3. When a product promotion is scheduled or triggered, StallHq:
   a. Fetches the product image from the vendor's store
   b. Creates a media container via POST to /{ig-user-id}/media
   c. Publishes the container via POST to /{ig-user-id}/media_publish
4. The promotion appears as a feed post on the vendor's Instagram Business account

Each vendor connects their own Instagram Business account via OAuth. StallHq 
does not store Instagram credentials — we use system user tokens managed by 
the vendor through Meta Business Settings.

Content posted:
- Product images (JPEG format, vendor-provided)
- Product captions with name, price, and store link
- No user-generated content, no UGC, no scraped content

Posting frequency:
- Maximum 5 posts per vendor per day (well under Instagram's 100/day limit)
- Posts are scheduled by the vendor, not automated spam

Data handling:
- StallHq stores only the vendor's Instagram User ID and access token
- Tokens are encrypted at rest in Supabase
- Tokens are refreshed automatically before expiry
- Vendors can disconnect their Instagram account at any time
- Upon disconnection, all Instagram-related data is deleted within 24 hours
```

#### Screencast Requirements

You must record a screencast showing:

1. **Login Flow:**
   - Show the StallHq login page
   - Log in as a vendor
   - Navigate to Store Settings → Social Media

2. **Instagram Connection:**
   - Click "Connect Instagram"
   - Show the OAuth dialog (Meta login screen)
   - Complete the authorization
   - Show the connected status in the dashboard

3. **Promo Card Creation:**
   - Navigate to Products → Select a product
   - Click "Generate Promo Card"
   - Show the card preview with aurora effects
   - Click "Download" or "Post to Instagram"

4. **Instagram Posting:**
   - Show the posting confirmation
   - Navigate to Instagram (or refresh the page)
   - Show the published post on the Instagram profile

**Screencast tips:**
- Record at 1920×1080 or higher
- Show the full browser window (including URL bar)
- Narrate what you're doing (optional but helpful)
- Keep it under 5 minutes
- Show real interaction, not mockups

### Step 4: Submit for Review

1. Go to **App Review** → **Submissions**
2. Click **Start a Submission**
3. Select `instagram_content_publish` permission
4. Fill in:
   - **Permission:** `instagram_content_publish`
   - **Details:** Paste the use case description above
   - **Screencast:** Upload your recording
   - **Testing instructions:** "Log in as a vendor, connect Instagram account in Store Settings, generate a promo card, and post it to Instagram."
5. Submit

### Step 5: Wait for Review

- Review timeline: **2-4 weeks**
- You'll receive email notifications about status
- If rejected, fix the issues and resubmit

---

## Important Notes

### Permission Naming

Meta has two API versions:
- **Facebook Login:** `instagram_content_publish` (older)
- **Instagram Login:** `instagram_business_content_publish` (newer)

Your app uses Facebook Login, so you need `instagram_content_publish`.

### Image Format Requirements

Instagram only accepts **JPEG** images via the API. Your current code sends PNG URLs from Supabase Storage. You may need to:
1. Convert images to JPEG before posting, OR
2. Store images as JPEG in Supabase, OR
3. Use a proxy that converts PNG→JPEG on the fly

### Token Lifetime

System user tokens from Business Settings **never expire**. This is why you chose them. But:
- They still require App Review to work in production
- The token must have the correct permissions assigned

### What Happens During Review

- Your app stays in Development Mode
- Only test users (explicitly added in App Dashboard) can authenticate
- Real users cannot connect their Instagram accounts
- Once approved, you get Advanced Access and real users can connect

---

## Troubleshooting

### "Unsupported post request" error
- Instagram account is not a Business/Creator profile
- Instagram account is not linked to a Facebook Page

### "Invalid image URL" error
- Image URL is not publicly accessible
- Image is not JPEG format
- Image URL is behind authentication

### "Permission denied" or "scope" error
- Token doesn't have `instagram_content_publish` permission
- App doesn't have Advanced Access for the permission
- Token is expired or invalid

### Posts succeed but don't appear on Instagram
- **This is the current issue** — caused by Development Mode
- Only happens when App Review is not completed
- Once approved, posts will appear normally

---

## Your App Details

| Field | Value |
|-------|-------|
| App ID | `1687087632336203` |
| App Name | StallHq |
| Instagram Business Account | `17841452657298939` |
| Facebook Page | Zerupthcodes (`1145498245321449`) |
| Phone Number ID | `1205852122604410` |
| API Version | `v23.0` |
| Privacy Policy | `https://stallhq.com/privacy` |
| Terms of Service | `https://stallhq.com/terms` |

---

## Next Actions

1. [ ] Record screencast (5 min max)
2. [ ] Update App Settings (icon, description, privacy URL)
3. [ ] Configure Data Deletion URL
4. [ ] Submit for App Review
5. [ ] Wait 2-4 weeks for approval
6. [ ] After approval, test with a real vendor account
