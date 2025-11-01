export const MACROPAD_ROWS = 6
export const MACROPAD_COLUMNS = 4

export function createControlId(row: number, column: number): string {
	return `${row}/${column}`
}
export function parseControlId(controlId: string): { row: number; column: number } {
	const [rowStr, columnStr] = controlId.split('/')
	return {
		row: parseInt(rowStr, 10),
		column: parseInt(columnStr, 10),
	}
}
