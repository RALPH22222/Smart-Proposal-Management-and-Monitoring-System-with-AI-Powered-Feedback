import React, { useState, useEffect } from 'react';

interface EvaluatorOption {
	id: string;
	name: string;
	department: string;
	status: 'Accepts' | 'Rejected' | 'Pending';
}

interface RnDEvaluatorPageModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentEvaluators?: EvaluatorOption[];
	onReassign: (newEvaluators: EvaluatorOption[]) => void;
}

const RnDEvaluatorPageModal: React.FC<RnDEvaluatorPageModalProps> = ({
	isOpen,
	onClose,
	currentEvaluators = [],
	onReassign
}) => {
	const departments = [
		'Information Technology',
		'Computer Science',
		'Engineering'
	];

	const mockEvaluators: Record<string, EvaluatorOption[]> = {
		'Information Technology': [
			{
				id: 'e1',
				name: 'Dr. Alice Santos',
				department: 'Information Technology',
				status: 'Pending'
			},
			{
				id: 'e2',
				name: 'Prof. Ben Reyes',
				department: 'Information Technology',
				status: 'Accepts'
			},
			{
				id: 'e7',
				name: 'Dr. Michael Chen',
				department: 'Information Technology',
				status: 'Pending'
			},
			{
				id: 'e8',
				name: 'Prof. Sarah Johnson',
				department: 'Information Technology',
				status: 'Accepts'
			}
		],
		'Computer Science': [
			{
				id: 'e3',
				name: 'Dr. Carla Lim',
				department: 'Computer Science',
				status: 'Rejected'
			},
			{
				id: 'e4',
				name: 'Prof. David Tan',
				department: 'Computer Science',
				status: 'Pending'
			},
			{
				id: 'e9',
				name: 'Dr. Robert Wilson',
				department: 'Computer Science',
				status: 'Accepts'
			},
			{
				id: 'e10',
				name: 'Prof. Lisa Garcia',
				department: 'Computer Science',
				status: 'Pending'
			}
		],
		Engineering: [
			{
				id: 'e5',
				name: 'Dr. John Cruz',
				department: 'Engineering',
				status: 'Accepts'
			},
			{
				id: 'e6',
				name: 'Prof. Eva Martinez',
				department: 'Engineering',
				status: 'Rejected'
			},
			{
				id: 'e11',
				name: 'Dr. James Brown',
				department: 'Engineering',
				status: 'Accepts'
			},
			{
				id: 'e12',
				name: 'Prof. Maria Rodriguez',
				department: 'Engineering',
				status: 'Pending'
			}
		]
	};

	const [selectedDepartment, setSelectedDepartment] = useState('');
	const [availableEvaluators, setAvailableEvaluators] = useState<EvaluatorOption[]>([]);
	const [filteredEvaluators, setFilteredEvaluators] = useState<EvaluatorOption[]>([]);
	const [selectedEvaluators, setSelectedEvaluators] = useState<EvaluatorOption[]>([]);
	const [currentList, setCurrentList] = useState<EvaluatorOption[]>([]);
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		// Seed with provided current evaluators, else use a small mock for visibility
		if (currentEvaluators.length > 0) {
			setCurrentList(currentEvaluators);
		} else {
			setCurrentList([
				{
					id: 'e1',
					name: 'Dr. Alice Santos',
					department: 'Information Technology',
					status: 'Pending'
				},
				{
					id: 'e3',
					name: 'Dr. Carla Lim',
					department: 'Computer Science',
					status: 'Accepts'
				},
				{
					id: 'e5',
					name: 'Dr. John Cruz',
					department: 'Engineering',
					status: 'Rejected'
				}
			]);
		}
	}, [currentEvaluators]);

	useEffect(() => {
		// Filter available evaluators based on search query
		if (searchQuery.trim() === '') {
			setFilteredEvaluators(availableEvaluators);
		} else {
			const query = searchQuery.toLowerCase();
			const filtered = availableEvaluators.filter(evaluator =>
				evaluator.name.toLowerCase().includes(query) ||
				evaluator.department.toLowerCase().includes(query)
			);
			setFilteredEvaluators(filtered);
		}
	}, [availableEvaluators, searchQuery]);

	const handleDepartmentChange = (dept: string) => {
		setSelectedDepartment(dept);
		const evaluators = mockEvaluators[dept] || [];
		setAvailableEvaluators(evaluators);
		setFilteredEvaluators(evaluators);
		setSelectedEvaluators([]);
		setSearchQuery(''); // Reset search when department changes
	};

	const handleEvaluatorSelect = (evaluator: EvaluatorOption) => {
		setSelectedEvaluators((prev) =>
			prev.some((ev) => ev.id === evaluator.id)
				? prev.filter((ev) => ev.id !== evaluator.id)
				: [...prev, evaluator]
		);
	};

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	const handleReplaceEvaluator = (id: string) => {
		setCurrentList((prev) => prev.filter((ev) => ev.id !== id));
	};

	const handleRemoveEvaluator = (id: string) => {
		setCurrentList((prev) => prev.filter((ev) => ev.id !== id));
	};

	const handleConfirm = () => {
		const updatedEvaluators = [...currentList, ...selectedEvaluators];
		onReassign(updatedEvaluators);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50 p-4'>
			<div className='bg-white rounded-lg w-full max-w-4xl shadow-lg overflow-hidden flex flex-col max-h-[90vh]'>
				{/* Header */}
				<div className='bg-gray-100 border-b border-slate-200 text-gray-800 px-6 py-4 flex justify-between items-center'>
					<h3 className='text-lg font-semibold'>Evaluator Management</h3>
					<button
						onClick={onClose}
						className="text-black text-xl hover:bg-white hover:text-black transition-colors duration-300 p-1 rounded-lg"
					>
						✕
					</button>
				</div>

				{/* Body */}
				<div className='p-6 overflow-y-auto flex-1 space-y-6'>
					{/* Current Evaluators */}
					<div className='bg-gray-50 p-5 rounded-md border border-gray-200'>
						<h4 className='font-semibold text-gray-800 mb-4'>
							Current Evaluators
						</h4>
						{currentList.length > 0 ? (
							<table className='w-full text-sm border border-gray-200 rounded-lg'>
								<thead className='bg-gray-100'>
									<tr>
										<th className='px-4 py-2 text-left text-gray-600'>Name</th>
										<th className='px-4 py-2 text-left text-gray-600'>
											Department
										</th>
										<th className='px-4 py-2 text-left text-gray-600'>
											Status
										</th>
										<th className='px-4 py-2 text-center text-gray-600'>
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{currentList.map((ev) => (
										<tr key={ev.id} className='border-t hover:bg-gray-50'>
											<td className='px-4 py-2 text-gray-800 font-medium'>
												{ev.name}
											</td>
											<td className='px-4 py-2 text-gray-600'>
												{ev.department}
											</td>
											<td
												className={`px-4 py-2 font-medium ${
													ev.status === 'Accepts'
														? 'text-green-700'
														: ev.status === 'Rejected'
														? 'text-red-700'
														: 'text-yellow-700'
												}`}
											>
												{ev.status}
											</td>
											<td className='px-4 py-2 text-center space-x-2'>
												<button
													onClick={() => handleReplaceEvaluator(ev.id)}
													className='px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md'
												>
													Replace
												</button>
												<button
													onClick={() => handleRemoveEvaluator(ev.id)}
													className='px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md'
												>
													Remove
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						) : (
							<p className='text-gray-500 italic'>
								No evaluators currently assigned.
							</p>
						)}
					</div>

					{/* Department Selection */}
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Select Department
						</label>
						<select
							value={selectedDepartment}
							onChange={(e) => handleDepartmentChange(e.target.value)}
							className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#C10003] focus:outline-none bg-white'
						>
							<option value=''>-- Choose Department --</option>
							{departments.map((dept) => (
								<option key={dept} value={dept}>
									{dept}
								</option>
							))}
						</select>
					</div>

					{/* Evaluator Selection */}
					{selectedDepartment && (
						<div className='bg-gray-50 p-5 rounded-md border border-gray-200'>
							<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
								<h4 className='font-semibold text-gray-800'>
									Available Evaluators
								</h4>
								
								{/* Search Input */}
								<div className='relative max-w-xs'>
									<input
										type='text'
										placeholder='Search evaluators...'
										value={searchQuery}
										onChange={handleSearchChange}
										className='w-full border border-gray-300 rounded-md pl-3 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#C10003] focus:outline-none'
									/>
									{searchQuery && (
										<button
											onClick={() => setSearchQuery('')}
											className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
										>
											✕
										</button>
									)}
								</div>
							</div>

							{filteredEvaluators.length === 0 ? (
								<p className='text-gray-500 italic text-sm'>
									{searchQuery ? 'No evaluators found matching your search.' : 'No evaluators available for this department.'}
								</p>
							) : (
								<div className='space-y-3 max-h-60 overflow-y-auto'>
									{filteredEvaluators.map((evaluator) => (
										<label
											key={evaluator.id}
											className='flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer'
										>
											<input
												type='checkbox'
												checked={selectedEvaluators.some(
													(ev) => ev.id === evaluator.id
												)}
												onChange={() => handleEvaluatorSelect(evaluator)}
												className='text-[#C10003] focus:ring-[#C10003]'
											/>
											<div className='flex-1'>
												<span className='text-gray-700 text-sm font-medium'>
													{evaluator.name}
												</span>
												<span className='text-gray-500 text-xs block mt-1'>
													{evaluator.department}
												</span>
											</div>
											{selectedEvaluators.some((ev) => ev.id === evaluator.id) && (
												<span className='text-xs text-[#C10003] font-medium'>
													Selected
												</span>
											)}
										</label>
									))}
								</div>
							)}
							
							{/* Selected Count */}
							{selectedEvaluators.length > 0 && (
								<div className='mt-3 pt-3 border-t border-gray-200'>
									<p className='text-sm text-gray-600'>
										{selectedEvaluators.length} evaluator{selectedEvaluators.length !== 1 ? 's' : ''} selected
									</p>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className='p-4 border-t bg-gray-50 flex justify-end gap-3'>
					<button
						onClick={onClose}
						className='px-4 py-2 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-gray-700 font-medium'
					>
						Close
					</button>
					<button
						onClick={handleConfirm}
						className='px-4 py-2 rounded-md text-white font-medium bg-[#C10003] hover:bg-[#A00002] disabled:opacity-50'
						disabled={selectedEvaluators.length === 0}
					>
						Confirm Reassignment
					</button>
				</div>
			</div>
		</div>
	);
};

export default RnDEvaluatorPageModal;