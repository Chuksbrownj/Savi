import { Password } from './password.value-object';

describe('Password value object', () => {
  it('should hash a plaintext password', async () => {
    const pwd = await Password.create('MyP@ss1');
    expect(pwd.hash).toBeDefined();
    expect(pwd.hash).not.toBe('MyP@ss1');
    expect(pwd.hash.length).toBeGreaterThan(32);
  });

  it('should verify a correct plaintext against the hash', async () => {
    const pwd = await Password.create('MyP@ss1');
    const valid = await pwd.verify('MyP@ss1');
    expect(valid).toBe(true);
  });

  it('should reject an incorrect plaintext', async () => {
    const pwd = await Password.create('MyP@ss1');
    const valid = await pwd.verify('WrongPass');
    expect(valid).toBe(false);
  });

  it('fromHash should wrap an existing hash', async () => {
    const pwd = await Password.create('MyP@ss1');
    const loaded = Password.fromHash(pwd.hash);
    const valid = await loaded.verify('MyP@ss1');
    expect(valid).toBe(true);
  });
});
