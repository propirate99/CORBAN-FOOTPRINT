import { describe, it, expect } from 'vitest';

describe('Room Status Calculation Logic', () => {
  function determineRoomStatus(occupants: number, activePowerKw: number): 'OPTIMAL' | 'IN_USE' | 'WASTEFUL' {
    if (occupants === 0 && activePowerKw > 1.5) {
      return 'WASTEFUL';
    }
    if (occupants > 0) {
      return 'IN_USE';
    }
    return 'OPTIMAL';
  }

  it('flags room as WASTEFUL when 0 occupants but high power draw', () => {
    const status = determineRoomStatus(0, 4.8);
    expect(status).toBe('WASTEFUL');
  });

  it('marks room as IN_USE when occupants are present', () => {
    const status = determineRoomStatus(25, 3.2);
    expect(status).toBe('IN_USE');
  });

  it('marks room as OPTIMAL when empty and low standby power', () => {
    const status = determineRoomStatus(0, 0.4);
    expect(status).toBe('OPTIMAL');
  });
});
