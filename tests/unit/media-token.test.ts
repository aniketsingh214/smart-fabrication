import { beforeEach,afterEach,describe,it,expect,vi } from 'vitest';
import { enquiryUploadToken,verifyEnquiryToken } from '@/lib/cloudinary/guest-token';
describe('Enquiry upload capability',()=>{
 beforeEach(()=>{vi.stubEnv('ENQUIRY_UPLOAD_SECRET','unit-test-secret-which-is-not-a-real-credential');vi.useFakeTimers();});
 afterEach(()=>{vi.unstubAllEnvs();vi.useRealTimers();});
 it('binds upload access to the created enquiry',()=>{const lead=crypto.randomUUID();expect(verifyEnquiryToken(enquiryUploadToken(lead)!)).toBe(lead);});
 it('rejects tampering and malformed/unicode signatures as authentication errors',()=>{const token=enquiryUploadToken(crypto.randomUUID())!;expect(()=>verifyEnquiryToken(`x${token}`)).toThrow();expect(()=>verifyEnquiryToken(`${token.split('.')[0]}.${'é'.repeat(43)}`)).toThrowError(expect.objectContaining({status:401}));});
 it('expires after the enquiry upload window',()=>{const token=enquiryUploadToken(crypto.randomUUID())!;vi.advanceTimersByTime(16*60000);expect(()=>verifyEnquiryToken(token)).toThrowError(expect.objectContaining({code:'UPLOAD_EXPIRED',status:401}));});
 it('does not issue anonymous upload access when the secret is missing',()=>{vi.stubEnv('ENQUIRY_UPLOAD_SECRET','');expect(enquiryUploadToken(crypto.randomUUID())).toBeUndefined();expect(()=>verifyEnquiryToken('any')).toThrow();});
});
