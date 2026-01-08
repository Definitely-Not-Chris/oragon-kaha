import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashes a plain text PIN using bcrypt.
 * @param pin The 4-digit PIN to hash.
 * @returns The hashed PIN string.
 */
export const hashPin = async (pin: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(pin, SALT_ROUNDS, (err, hash) => {
            if (err) {
                reject(err);
            } else {
                resolve(hash!);
            }
        });
    });
};

/**
 * Verifies a plain text PIN against a stored hash.
 * @param pin The plain text PIN to verify.
 * @param hash The stored hashed PIN.
 * @returns True if the PIN matches, false otherwise.
 */
export const verifyPin = async (pin: string, hash: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(pin, hash, (err, success) => {
            if (err) {
                reject(err);
            } else {
                resolve(success!);
            }
        });
    });
};
