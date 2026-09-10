# Passkey (WebAuthn / FIDO2) Implementation

## Overview

Umbreon Store sekarang mendukung **Passkey** untuk login yang lebih aman tanpa password tradisional. Implementasi ini menggunakan WebAuthn standard W3C yang kompatibel dengan:

- Platform authenticators (Windows Hello, Face ID, Touch ID, dll)
- Security keys (YubiKey, Titan, dll)
- Perangkat mobile dengan biometric

## Database Schema

### Table: `passkey_credentials`
```sql
CREATE TABLE passkey_credentials (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (FK -> users),
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  transports VARCHAR(255),
  credential_device_type VARCHAR(32),
  credential_backed_up BOOLEAN DEFAULT false,
  aaguid VARCHAR(64),
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

INDEX: user_idx (user_id)
```

## API Endpoints

### 1. Registration - Get Options
**POST** `/auth/passkey/register/options`

Request body:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "challenge_token": "base64_encoded_challenge",
    "options": {
      "challenge": "random_base64url_string",
      "rp": {
        "name": "Umbreon Store",
        "id": "umbreon.store"
      },
      "user": {
        "id": "base64url_user_id",
        "name": "user@example.com",
        "displayName": "User Name"
      },
      "pubKeyCredParams": [
        { "alg": -7, "type": "public-key" },
        { "alg": -257, "type": "public-key" }
      ],
      "timeout": 60000,
      "attestation": "direct",
      "excludeCredentials": []
    }
  }
}
```

### 2. Registration - Verify
**POST** `/auth/passkey/register/verify`

Request body:
```json
{
  "email": "user@example.com",
  "challenge_token": "base64_encoded_challenge",
  "response": {
    // Output dari navigator.credentials.create()
    "id": "credential_id",
    "response": {
      "publicKey": "base64url_public_key",
      "signCount": 0,
      "transports": ["internal", "usb"]
    }
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Passkey registered successfully"
}
```

### 3. Login - Get Options
**POST** `/auth/passkey/login/options`

Request body:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "challenge_token": "base64_encoded_challenge",
    "options": {
      "challenge": "random_base64url_string",
      "timeout": 60000,
      "userVerification": "preferred",
      "rpId": "example.com",
      "allowCredentials": [
        {
          "id": "credential_id_1",
          "type": "public-key",
          "transports": ["internal"]
        }
      ]
    }
  }
}
```

### 4. Login - Verify
**POST** `/auth/passkey/login/verify`

Headers required:
```
X-Device-ID: 550e8400-e29b-41d4-a716-446655440000
User-Agent: Mozilla/5.0...
```

Request body:
```json
{
  "email": "user@example.com",
  "challenge_token": "base64_encoded_challenge",
  "response": {
    // Output dari navigator.credentials.get()
    "id": "credential_id",
    "response": {
      "signCount": 1,
      "userVerified": true
    }
  }
}
```

Response (same as traditional login):
```json
{
  "success": true,
  "message": "Passkey login successful",
  "data": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "access_token_expired_at": "2024-03-28T...",
    "refresh_token_expired_at": "2024-04-04T...",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "is_banned": false,
      "role": "user"
    },
    "device": {
      "name": "Chrome on Windows",
      "fingerprint": "device_fingerprint",
      "type": "desktop",
      "is_umbreon_app": false,
      "login_from": "web"
    }
  }
}
```

## Environment Configuration

Add these variables ke `.env` file:

```env
# WebAuthn configuration
WEBAUTHN_RP_ID=umbreon.store
WEBAUTHN_RP_NAME=Umbreon Store
WEBAUTHN_ORIGIN=https://umbreon.store
```

## Client-Side Implementation (TypeScript/JavaScript)

### Registration Flow

```typescript
import {
  startRegistration,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser'

// 1. Check browser support
if (browserSupportsWebAuthn()) {
  try {
    // 2. Get registration options from server
    const optionsRes = await fetch('/auth/passkey/register/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail }),
    })
    
    const optionsData = await optionsRes.json()
    const { options, challenge_token } = optionsData.data

    // 3. Start WebAuthn registration
    const attResp = await startRegistration({ options })

    // 4. Verify registration on server
    const verifyRes = await fetch('/auth/passkey/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        challenge_token,
        response: attResp,
      }),
    })

    const result = await verifyRes.json()
    if (result.success) {
      console.log('Passkey registered successfully!')
    }
  } catch (error) {
    console.error('Registration failed:', error)
  }
}
```

### Login Flow

```typescript
import {
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser'

if (browserSupportsWebAuthn()) {
  try {
    // 1. Get login options from server
    const optionsRes = await fetch('/auth/passkey/login/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail }),
    })

    const optionsData = await optionsRes.json()
    const { options, challenge_token } = optionsData.data

    // 2. Start WebAuthn authentication
    const assertResp = await startAuthentication({ options })

    // 3. Verify authentication on server
    const verifyRes = await fetch('/auth/passkey/login/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId,
      },
      body: JSON.stringify({
        email: userEmail,
        challenge_token,
        response: assertResp,
      }),
    })

    const result = await verifyRes.json()
    if (result.success) {
      // Save tokens
      localStorage.setItem('access_token', result.data.access_token)
      localStorage.setItem('refresh_token', result.data.refresh_token)
      
      // Redirect to dashboard
      window.location.href = '/dashboard'
    }
  } catch (error) {
    console.error('Login failed:', error)
  }
}
```

## Security Considerations

### Counter Verification (Replay Attack Prevention)
- Setiap kali passkey digunakan, `signCount` harus meningkat
- Server akan menolak assertion jika counter turun atau tidak berubah
- Ini mencegah "replay attack" menggunakan credential yang sama

### Challenge Token
- Challenge di-generate secara random dari server
- Hanya valid untuk satu transaksi registrasi/login
- Expired setelah beberapa menit (default 60 detik)

### Device Fingerprinting
- Session akan menyimpan device fingerprint
- Login dari device yang berbeda akan membuat session baru

### User Verification
- Registration menggunakan `attestation: 'direct'` untuk verifikasi ketat
- Login menggunakan `userVerification: 'preferred'` untuk UX yang lebih baik

## Future Enhancements

1. **Dual Registration**: Kombinasi Passkey + Password untuk fallback
2. **Passwordless by Default**: Hapus password requirement jika user punya Passkey
3. **Account Recovery**: Tambah recovery codes saat registrasi Passkey
4. **Biometric-Only Mode**: Konfigurasi per user untuk authenticator yang diperlukan
5. **Attestation Verification**: Verify tanda tangan dari authenticator manufacturer
6. **Transaction Signing**: Gunakan Passkey untuk sign transaksi finansial (tidak cuma login)

## References

- [W3C WebAuthn Spec](https://www.w3.org/TR/webauthn-2/)
- [SimpleWebAuthn Library](https://simplewebauthn.dev/)
- [FIDO2 Alliance](https://fidoalliance.org/)
- [MDN - Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
