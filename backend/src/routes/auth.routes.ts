// auth.routes.ts
import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { pool } from '../db';

const router = express.Router();

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		const [rows] = await pool.query(
			'SELECT id, password FROM users WHERE email = ? LIMIT 1',
			[email]
		);
		const users = rows as { id: number; password: string }[];
		const user = users[0];

		if (!user) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		const passwordOk = await bcrypt.compare(password, user.password);
		if (!passwordOk) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		// // TEMPORARY: plain text compare just to get the flow working
		// if (password !== user.password) {
		// 	return res.status(401).json({ message: 'Invalid email or password' });
		// }

		// generate session token
		const token = crypto.randomBytes(32).toString('hex');

		// store session in DB (7 days expiry example)
		await pool.query(
			`
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
      `,
			[user.id, token]
		);

		// set cookie
		res.cookie('auth_token', token, {
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
		});

		// optional: log activity
		await pool.query(
			`INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES (?, 'LOGIN', NULL, NULL)`,
			[user.id]
		);

		return res.json({ message: 'Logged in successfully' });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Internal server error' });
	}
});
router.post('/logout', async (req, res) => {
	try {
		const token = req.cookies?.auth_token;

		if (token) {
			await pool.query(
				'UPDATE sessions SET revoked_at = NOW() WHERE token = ?',
				[token]
			);
			// or DELETE FROM sessions WHERE token = ?
		}

		res.clearCookie('auth_token');

		// optional: get user_id from token for logging
		// (skipping extra query for brevity)
		// await pool.query(
		//   `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
		//    VALUES (?, 'LOGOUT', NULL, NULL)`,
		//   [userId]
		// );

		return res.json({ message: 'Logged out successfully' });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Internal server error' });
	}
});

export default router;
