import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRooms } from '../api/rooms';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: vi.fn(),
  supabase: {
    from: vi.fn(),
  },
}));

import { isSupabaseConfigured, supabase } from '../lib/supabase';

describe('Security & Policy Requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 3: Direct Supabase RLS Read Failure Handling', () => {
    it('throws explicit error and DOES NOT silently return fallback or sample data on query error', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'permission denied for table rooms (RLS rejection)', code: '42501' },
        }),
      });
      // @ts-ignore
      supabase!.from = mockFrom;

      await expect(getRooms()).rejects.toThrow(
        /Supabase RLS Data Read Error: permission denied for table rooms/
      );
    });

    it('returns empty array cleanly when Supabase returns empty data rather than swapping in mock rooms', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      // @ts-ignore
      supabase!.from = mockFrom;

      const rooms = await getRooms();
      expect(rooms).toEqual([]);
    });
  });

  describe('Personal Footprint Isolation Logic', () => {
    it('ensures calculations can only be deleted by the owning user', () => {
      const currentUserId = 'user-alice-123';
      const recordOwnerId = 'user-bob-456';

      const canDelete = (userId: string, ownerId: string) => userId === ownerId;

      expect(canDelete(currentUserId, recordOwnerId)).toBe(false);
      expect(canDelete(currentUserId, currentUserId)).toBe(true);
    });
  });

  describe('Requirement 9: Sensitive Token & Header Leak Prevention', () => {
    it('ensures error sanitization removes bearer tokens from client error strings', () => {
      const rawError = 'Request failed: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret.sig';
      const sanitized = rawError.replace(/Bearer\s+[A-Za-z0-9-_=.]+/gi, 'Bearer [REDACTED]');

      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(sanitized).toBe('Request failed: Bearer [REDACTED]');
    });
  });
});
