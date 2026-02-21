export type Expense = {
    id: string;
    amount: number;
    paid_by: string;
}

export type Split = {
    expense_id: string;
    user_id: string;
    amount_owed: number;
    is_settled: boolean;
}

export type UserBalance = {
    userId: string;
    name: string;
    netBalance: number; // Positive means they are owed money, negative means they owe money
}

// A simple algorithm to calculate net balances for each user in a trip
export function calculateBalances(
    members: { id: string, name: string }[],
    expenses: { id: string, amount: number, paid_by: string }[],
    splits: { expense_id: string, user_id: string, amount_owed: number, is_settled: boolean }[]
): UserBalance[] {

    // Initialize balances to 0
    const balances: Record<string, number> = {}
    members.forEach(m => balances[m.id] = 0)

    // 1. Add to the balance of the person who paid the expense
    expenses.forEach(exp => {
        if (balances[exp.paid_by] !== undefined) {
            balances[exp.paid_by] += Number(exp.amount)
        }
    })

    // 2. Subtract from the balance of anyone who owes a split (that isn't settled)
    // For MVP, if you owe $50, your net balance drops by $50.
    splits.forEach(split => {
        // Only subtract if it's not settled (the payer's own split is marked settled on creation)
        if (!split.is_settled && balances[split.user_id] !== undefined) {
            balances[split.user_id] -= Number(split.amount_owed)
        }
    })

    // Format the output
    return members.map(m => ({
        userId: m.id,
        name: m.name,
        netBalance: balances[m.id]
    })).sort((a, b) => b.netBalance - a.netBalance) // Sort highest positive (owed) to lowest negative (owes)
}
