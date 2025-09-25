import React, { useEffect, useState } from 'react';
import ProponentNavbar from '../../../components/Proponent-navbar';
import {
	changeMyPassword,
	getMyProfile,
	setMyNotifications,
	updateMyAvatar,
	updateMyEmail,
	updateMyName,
	type UserProfile
} from '../../../services/user/userService';

const Settings: React.FC = () => {
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [notificationsEnabled, setNotificationsEnabled] = useState(false);

	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const me = await getMyProfile();
				setProfile(me);
				setName(me.name || '');
				setEmail(me.email || '');
				setNotificationsEnabled(Boolean(me.notificationsEnabled));
			} catch (e) {
				if (e instanceof Error) {
					setError(e?.message || 'Failed to load profile');
				}
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const withFeedback = async (fn: () => Promise<any>, successMsg: string) => {
		setError(null);
		setSuccess(null);
		setLoading(true);
		try {
			const res = await fn();
			setSuccess(successMsg);
			return res;
		} catch (e) {
			if (e instanceof Error) {
				setError(e?.message || 'Something went wrong');
			}
		} finally {
			setLoading(false);
		}
	};

	const onSaveName = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setError('Name cannot be empty');
			return;
		}
		const updated = await withFeedback(
			() => updateMyName(name.trim()),
			'Name updated'
		);
		if (updated) setProfile(updated);
	};

	const onChangeAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		await withFeedback(async () => {
			const res = await updateMyAvatar(file);
			setProfile((prev) =>
				prev ? { ...prev, avatarUrl: res.avatarUrl } : prev
			);
			return res;
		}, 'Profile picture updated');
		e.currentTarget.value = '';
	};

	const onChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!currentPassword || !newPassword) {
			setError('Please fill out current and new password');
			return;
		}
		if (newPassword !== confirmPassword) {
			setError('New password and confirm password do not match');
			return;
		}
		await withFeedback(
			() => changeMyPassword(currentPassword, newPassword),
			'Password changed successfully'
		);
		setCurrentPassword('');
		setNewPassword('');
		setConfirmPassword('');
	};

	const onChangeEmail = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim()) {
			setError('Email cannot be empty');
			return;
		}
		await withFeedback(
			() => updateMyEmail(email.trim(), currentPassword || undefined),
			'Email updated'
		);
	};

	const onToggleNotifications = async (checked: boolean) => {
		setNotificationsEnabled(checked);
		await withFeedback(
			async () => {
				const res = await setMyNotifications(checked);
				setNotificationsEnabled(res.enabled);
				setProfile((p) =>
					p ? { ...p, notificationsEnabled: res.enabled } : p
				);
				return res;
			},
			checked ? 'Notifications enabled' : 'Notifications disabled'
		);
	};

	return (
		<div className='min-h-screen bg-gray-50'>
			<ProponentNavbar />
			<div className='h-16' />
			<main className='max-w-5xl mx-auto px-4 py-6'>
				<header className='mb-6'>
					<h1 className='text-2xl font-semibold text-gray-800'>Settings</h1>
					<p className='text-sm text-gray-500'>
						Manage your account preferences.
					</p>
				</header>

				{(error || success) && (
					<div className='mb-4'>
						{error && (
							<div className='rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700'>
								{error}
							</div>
						)}
						{success && (
							<div className='rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700'>
								{success}
							</div>
						)}
					</div>
				)}

				<section className='bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6'>
					<h2 className='text-lg font-medium text-gray-800'>Profile</h2>
					<p className='text-sm text-gray-500 mb-4'>
						Update your name and profile picture.
					</p>
					<div className='flex items-start gap-6 flex-wrap'>
						<div className='flex items-center gap-4'>
							<img
								src={
									profile?.avatarUrl ||
									`https://ui-avatars.com/api/?name=${encodeURIComponent(
										name || 'User'
									)}&background=E5E7EB&color=111827`
								}
								alt='Avatar'
								className='h-16 w-16 rounded-full object-cover border'
							/>
							<div>
								<label className='inline-flex items-center px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer'>
									<input
										type='file'
										accept='image/*'
										className='hidden'
										onChange={onChangeAvatar}
									/>
									Change photo
								</label>
								<div className='text-xs text-gray-500 mt-1'>
									PNG or JPG up to 2MB.
								</div>
							</div>
						</div>

						<form onSubmit={onSaveName} className='flex-1 min-w-[260px]'>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Display name
							</label>
							<input
								type='text'
								value={name}
								onChange={(e) => setName(e.target.value)}
								className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300'
								placeholder='Your name'
							/>
							<div className='mt-3'>
								<button
									type='submit'
									disabled={loading}
									className='px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-800 text-white disabled:opacity-50'
								>
									Save name
								</button>
							</div>
						</form>
					</div>
				</section>

				<section className='bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6'>
					<h2 className='text-lg font-medium text-gray-800'>Security</h2>
					<p className='text-sm text-gray-500 mb-4'>
						Change your password to keep your account secure.
					</p>
					<form
						onSubmit={onChangePassword}
						className='grid grid-cols-1 sm:grid-cols-2 gap-4'
					>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Current password
							</label>
							<input
								type='password'
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300'
								placeholder='Enter current password'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								New password
							</label>
							<input
								type='password'
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300'
								placeholder='Enter new password'
							/>
						</div>
						<div className='sm:col-span-2'>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Confirm new password
							</label>
							<input
								type='password'
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300'
								placeholder='Re-enter new password'
							/>
						</div>
						<div className='sm:col-span-2'>
							<button
								type='submit'
								disabled={loading}
								className='px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-800 text-white disabled:opacity-50'
							>
								Change password
							</button>
						</div>
					</form>
				</section>

				<section className='bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6'>
					<h2 className='text-lg font-medium text-gray-800'>Email</h2>
					<p className='text-sm text-gray-500 mb-4'>
						Update the email associated with your account.
					</p>
					<form
						onSubmit={onChangeEmail}
						className='grid grid-cols-1 sm:grid-cols-2 gap-4'
					>
						<div>
							<label className='block text sm font-medium text-gray-700 mb-1'>
								New email
							</label>
							<input
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300'
								placeholder='your@email.com'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Confirm with password
							</label>
							<input
								type='password'
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300'
								placeholder='Enter current password'
							/>
						</div>
						<div className='sm:col-span-2'>
							<button
								type='submit'
								disabled={loading}
								className='px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-800 text-white disabled:opacity-50'
							>
								Update email
							</button>
						</div>
					</form>
				</section>

				<section className='bg-white rounded-lg shadow-sm border border-gray-100 p-4'>
					<h2 className='text-lg font-medium text-gray-800'>Notifications</h2>
					<p className='text-sm text-gray-500 mb-4'>
						Choose whether to receive updates about your proposals.
					</p>
					<div className='flex items-center gap-3'>
						<button
							type='button'
							onClick={() => onToggleNotifications(!notificationsEnabled)}
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
								notificationsEnabled ? 'bg-green-500' : 'bg-gray-300'
							}`}
							aria-pressed={notificationsEnabled}
						>
							<span
								className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
									notificationsEnabled ? 'translate-x-5' : 'translate-x-1'
								}`}
							/>
						</button>
						<span className='text-sm text-gray-700'>
							{notificationsEnabled
								? 'Notifications are ON'
								: 'Notifications are OFF'}
						</span>
					</div>
				</section>
			</main>
		</div>
	);
};

export default Settings;
