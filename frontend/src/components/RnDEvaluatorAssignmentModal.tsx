import React, { useState } from 'react';
import { type Evaluator } from '../types/evaluator';
import { type Proposal } from '../types/InterfaceProposal';

interface EvaluatorAssignmentData {
	department: string;
	evaluators: Evaluator[];
}

interface RnDEvaluatorAssignmentModalProps {
	proposal: Proposal; // OK (parent passes a non-null proposal)
	isOpen: boolean;
	onClose: () => void;
	onAssignEvaluators: (data: EvaluatorAssignmentData) => void;
}

const RnDEvaluatorAssignmentModal: React.FC<
	RnDEvaluatorAssignmentModalProps
> = ({ onClose, onAssignEvaluators }) => {
	const [selectedDepartment, setSelectedDepartment] = useState<string>('');
	const [availableEvaluators, setAvailableEvaluators] = useState<Evaluator[]>(
		[]
	);
	const [selectedEvaluators, setSelectedEvaluators] = useState<Evaluator[]>([]);

	const evaluators: Evaluator[] = [
		{
			id: '1',
			name: 'Dr. Alice Santos',
			department: 'Information Technology',
			specialty: ['AI', 'Systems'],
			availabilityStatus: 'Available',
			currentWorkload: 2,
			maxWorkload: 5,
			rating: 4.8,
			completedReviews: 20,
			email: 'alice@wmsu.edu.ph'
		},
		{
			id: '2',
			name: 'Prof. Ben Reyes',
			department: 'Computer Science',
			specialty: ['Security', 'Networks'],
			availabilityStatus: 'Busy',
			currentWorkload: 4,
			maxWorkload: 5,
			rating: 4.5,
			completedReviews: 15,
			email: 'ben@wmsu.edu.ph'
		},
		{
			id: '3',
			name: 'Engr. Carla Lim',
			department: 'Information Technology',
			specialty: ['Databases', 'Web Dev'],
			availabilityStatus: 'Available',
			currentWorkload: 1,
			maxWorkload: 4,
			rating: 4.9,
			completedReviews: 30,
			email: 'carla@wmsu.edu.ph'
		}
	];

	return (
		<div className='p-6'>
			<h2 className='text-2xl font-bold text-[#C10003] mb-4'>
				Evaluator Assignment
			</h2>

			<div className='space-y-4'>
				{/* Department Dropdown */}
				<div>
					<label className='block text-sm font-medium text-gray-700'>
						Select Department
					</label>
					<select
						value={selectedDepartment}
						onChange={(e) => {
							const department = e.target.value;
							setSelectedDepartment(department);
							setAvailableEvaluators(
								evaluators.filter((e) => e.department === department)
							);
						}}
						className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#C10003] focus:ring-[#C10003] sm:text-sm'
					>
						<option value=''>-- Choose Department --</option>
						{[...new Set(evaluators.map((e) => e.department))].map((dept) => (
							<option key={dept} value={dept}>
								{dept}
							</option>
						))}
					</select>
				</div>

				{/* Evaluator Dropdown */}
				{selectedDepartment && (
					<div>
						<label className='block text-sm font-medium text-gray-700'>
							Select Evaluators
						</label>
						<select
							multiple
							onChange={(e) => {
								const selectedIds = Array.from(e.target.selectedOptions).map(
									(opt) => opt.value
								);
								setSelectedEvaluators(
									availableEvaluators.filter((ev) =>
										selectedIds.includes(ev.id)
									)
								);
							}}
							className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#C10003] focus:ring-[#C10003] sm:text-sm h-40'
						>
							{availableEvaluators.map((ev) => (
								<option key={ev.id} value={ev.id}>
									{ev.name} ({ev.specialty.join(', ')})
								</option>
							))}
						</select>
						<p className='text-xs text-gray-500 mt-1'>
							Hold <kbd>Ctrl</kbd> or <kbd>Cmd</kbd> to select multiple.
						</p>
					</div>
				)}

				{/* Selected Evaluators */}
				{selectedEvaluators.length > 0 && (
					<div className='mt-4'>
						<h4 className='text-sm font-medium text-gray-700'>
							Assigned Evaluators:
						</h4>
						<div className='flex flex-wrap gap-2 mt-2'>
							{selectedEvaluators.map((ev) => (
								<span
									key={ev.id}
									className='bg-[#C10003] text-white px-3 py-1 rounded-full text-xs flex items-center gap-2'
								>
									{ev.name}
									<button
										type='button'
										className='text-white hover:text-gray-200'
										onClick={() =>
											setSelectedEvaluators(
												selectedEvaluators.filter((e) => e.id !== ev.id)
											)
										}
									>
										✕
									</button>
								</span>
							))}
						</div>
					</div>
				)}
				<div className='mt-6 flex justify-end gap-3'>
					<button
						type='button'
						onClick={onClose}
						className='px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100'
					>
						Cancel
					</button>
					<button
						type='button'
						disabled={!selectedDepartment || selectedEvaluators.length === 0}
						onClick={() =>
							onAssignEvaluators({
								department: selectedDepartment,
								evaluators: selectedEvaluators
							})
						}
						className='px-4 py-2 rounded-md text-white bg-[#C10003] hover:bg-[#A00002] disabled:bg-gray-300'
					>
						Assign Evaluators
					</button>
				</div>
			</div>
		</div>
	);
};

export default RnDEvaluatorAssignmentModal;
