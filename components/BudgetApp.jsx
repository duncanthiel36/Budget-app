"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Wallet, LogOut, Settings } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../lib/AuthProvider";
import { useBudgetData } from "../lib/useBudgetData";

const ALL_CATEGORIES = [
  "Rent",
  "Food",
  "Investments",
  "Debt",
  "Pets",
  "Other",
  "Subscriptions",
  "Personal",
  "Utilities",
  "Transportation",
  "Health",
  "Travel",
];

const CATEGORY_COLORS = {
  Rent: "#5B7FA6",
  Food: "#B97D4B",
  Investments: "#8B6DAE",
  Debt: "#B15C5C",
  Pets: "#6B9C6E",
  Other: "#8A8F98",
  Subscriptions: "#4F9B96",
  Personal: "#C9A24A",
  Utilities: "#7C8E42",
  Transportation: "#C97B8B",
  Health: "#A65D8A",
  Travel: "#9C6B3F",
};

const TRACK_COLOR = "#E7E3D8";

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function shiftMonth(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}
function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function calendarCells(key) {
  const [y, m] = key.split("-").map(Number);
  const startWeekday = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return cells;
}
function dayNum(dateStr) {
  return Number(dateStr.slice(8, 10));
}
function money(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Math.round((n + Number.EPSILON) * 100) / 100
  );
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function BudgetApp() {
  const { user } = useAuth();
  const {
    transactions,
    setTransactions,
    targets,
    setTargets,
    visibleCategories,
    setVisibleCategories,
    loaded,
  } = useBudgetData();

  const displayCategories =
    visibleCategories && visibleCategories.length
      ? ALL_CATEGORIES.filter((c) => visibleCategories.includes(c))
      : ALL_CATEGORIES;

  const [page, setPage] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [draftVisible, setDraftVisible] = useState([]);
  const [autoPromptShown, setAutoPromptShown] = useState({});
  const [draftTargets, setDraftTargets] = useState({});

  const [formType, setFormType] = useState("debit");
  const [formDate, setFormDate] = useState(todayISO());
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState(ALL_CATEGORIES[0]);
  const [formError, setFormError] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    setSelectedDay(null);
  }, [selectedMonth]);

  const currentRealMonth = monthKey(new Date());
  useEffect(() => {
    if (!loaded) return;
    if (
      selectedMonth === currentRealMonth &&
      !targets[selectedMonth] &&
      !autoPromptShown[selectedMonth]
    ) {
      const blank = {};
      ALL_CATEGORIES.forEach((c) => (blank[c] = ""));
      setDraftTargets(blank);
      setShowTargetModal(true);
      setAutoPromptShown((p) => ({ ...p, [selectedMonth]: true }));
    }
  }, [loaded, selectedMonth, targets]);

  const monthTx = transactions.filter((t) => t.date.slice(0, 7) === selectedMonth);
  const spentByCategory = {};
  ALL_CATEGORIES.forEach((c) => (spentByCategory[c] = 0));
  let earned = 0;
  monthTx.forEach((t) => {
    if (t.type === "debit") spentByCategory[t.category] += t.amount;
    else earned += t.amount;
  });
  const totalSpent = ALL_CATEGORIES.reduce((s, c) => s + spentByCategory[c], 0);
  const monthTargets = targets[selectedMonth] || {};
  const totalTarget = ALL_CATEGORIES.reduce((s, c) => s + (Number(monthTargets[c]) || 0), 0);

  const totalBalance = transactions.reduce((bal, t) => {
    if (t.date.slice(0, 7) >= currentRealMonth) return bal;
    return bal + (t.type === "credit" ? t.amount : -t.amount);
  }, 0);

  function openTargetEditor() {
    const existing = targets[selectedMonth] || {};
    const d = {};
    ALL_CATEGORIES.forEach((c) => (d[c] = existing[c] != null ? String(existing[c]) : ""));
    setDraftTargets(d);
    setShowTargetModal(true);
  }
  function saveTargets() {
    const clean = {};
    ALL_CATEGORIES.forEach((c) => (clean[c] = Number(draftTargets[c]) || 0));
    setTargets((prev) => ({ ...prev, [selectedMonth]: clean }));
    setShowTargetModal(false);
  }
  const draftTotal = ALL_CATEGORIES.reduce((s, c) => s + (Number(draftTargets[c]) || 0), 0);

  function openCategoryEditor() {
    setDraftVisible(displayCategories);
    setShowCategoryModal(true);
  }
  function toggleDraftCategory(c) {
    setDraftVisible((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }
  function saveVisibleCategories() {
    setVisibleCategories(ALL_CATEGORIES.filter((c) => draftVisible.includes(c)));
    setShowCategoryModal(false);
  }

  function addTransaction() {
    const amt = Number(formAmount);
    if (!formDate) return setFormError("Enter a date.");
    if (!amt || amt <= 0) return setFormError("Enter an amount greater than zero.");
    if (formType === "debit" && !formCategory) return setFormError("Choose a category.");
    setTransactions((prev) => [
      {
        id: uid(),
        type: formType,
        date: formDate,
        amount: amt,
        category: formType === "debit" ? formCategory : null,
      },
      ...prev,
    ]);
    setFormAmount("");
    setFormError("");
  }
  function deleteTransaction(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  const sortedMonthTx = [...monthTx].sort((a, b) => (a.date < b.date ? 1 : -1));
  const txByDay = {};
  monthTx.forEach((t) => {
    (txByDay[t.date] = txByDay[t.date] || []).push(t);
  });

  function renderRow(t) {
    return (
      <div key={t.id} className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: t.type === "credit" ? "#3B7A57" : CATEGORY_COLORS[t.category] }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-stone-700">{t.type === "credit" ? "Income" : t.category}</p>
          <p className="text-xs text-stone-400">{t.date}</p>
        </div>
        <p className={`text-sm font-medium ${t.type === "credit" ? "text-emerald-700" : "text-stone-800"}`}>
          {t.type === "credit" ? "+" : "-"}
          {money(t.amount)}
        </p>
        <button
          onClick={() => deleteTransaction(t.id)}
          className="p-1.5 rounded-full hover:bg-stone-100 text-stone-300"
          aria-label="Delete transaction"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex justify-center">
      <div className="w-full max-w-sm bg-stone-50 pb-20">
        <div className="px-5 pt-5 flex items-center justify-between">
          <p className="text-xs text-stone-400 truncate max-w-[220px]">{user?.email}</p>
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>

        <div className="px-5 pt-2 pb-3 flex items-center justify-between">
          <button
            onClick={() => setSelectedMonth((m) => shiftMonth(m, -1))}
            className="p-2 rounded-full hover:bg-stone-200 text-stone-500"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-serif text-2xl text-stone-800 tracking-tight">
            {monthLabel(selectedMonth)}
          </h1>
          <button
            onClick={() => setSelectedMonth((m) => shiftMonth(m, 1))}
            className="p-2 rounded-full hover:bg-stone-200 text-stone-500"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {page === "overview" && (
          <div className="px-5">
            <div className="bg-white border border-stone-200 rounded-2xl px-4 py-2.5 mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-stone-400">Total balance</p>
              <p className={`font-serif text-lg ${totalBalance >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {totalBalance >= 0 ? "" : "-"}
                {money(Math.abs(totalBalance))}
              </p>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-white border border-stone-200 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-stone-400 mb-1">Earned</p>
                <p className="font-serif text-xl text-emerald-700">{money(earned)}</p>
              </div>
              <div className="flex-1 bg-white border border-stone-200 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-stone-400 mb-1">Spent</p>
                <p className="font-serif text-xl text-stone-800">{money(totalSpent)}</p>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-4 flex items-center gap-4">
              <DonutMini spent={totalSpent} target={totalTarget} color="#3D3B36" />
              <div className="flex-1">
                <p className="text-sm text-stone-500">Total target</p>
                <p className="font-serif text-lg text-stone-800">
                  {money(totalSpent)}{" "}
                  <span className="text-stone-400 text-sm font-sans">of {money(totalTarget)}</span>
                </p>
              </div>
              <button
                onClick={openTargetEditor}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-400"
                aria-label="Edit targets"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={openCategoryEditor}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-400"
                aria-label="Choose categories"
              >
                <Settings size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {displayCategories.map((c) => {
                const spent = spentByCategory[c];
                const target = Number(monthTargets[c]) || 0;
                const over = target > 0 && spent > target;
                return (
                  <div key={c} className="bg-white border border-stone-200 rounded-2xl p-3 flex flex-col items-center">
                    <DonutMini spent={spent} target={target} color={CATEGORY_COLORS[c]} size={72} />
                    <p className="text-sm font-medium text-stone-700 mt-2">{c}</p>
                    <p className="text-xs text-stone-400">
                      {money(spent)} / {money(target)}
                    </p>
                    {over && <p className="text-xs text-red-500 mt-0.5">over by {money(spent - target)}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {page === "transactions" && (
          <div className="px-5">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-4">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setFormType("debit")}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border ${
                    formType === "debit" ? "bg-stone-800 text-white border-stone-800" : "border-stone-200 text-stone-500"
                  }`}
                >
                  Debit
                </button>
                <button
                  onClick={() => setFormType("credit")}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border ${
                    formType === "credit" ? "bg-emerald-700 text-white border-emerald-700" : "border-stone-200 text-stone-500"
                  }`}
                >
                  Credit
                </button>
              </div>

              <div className="flex gap-2 mb-2">
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Amount"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-28 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700"
                />
              </div>

              {formType === "debit" && (
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 mb-2"
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}

              {formError && <p className="text-xs text-red-500 mb-2">{formError}</p>}

              <button
                onClick={addTransaction}
                className="w-full flex items-center justify-center gap-1 bg-stone-800 text-white rounded-xl py-2 text-sm font-medium"
              >
                <Plus size={16} /> Add transaction
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 py-1.5 rounded-xl text-sm font-medium border ${
                  viewMode === "list" ? "bg-stone-800 text-white border-stone-800" : "border-stone-200 text-stone-500"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex-1 py-1.5 rounded-xl text-sm font-medium border ${
                  viewMode === "calendar" ? "bg-stone-800 text-white border-stone-800" : "border-stone-200 text-stone-500"
                }`}
              >
                Calendar
              </button>
            </div>

            {viewMode === "list" && (
              <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100 overflow-hidden">
                {sortedMonthTx.length === 0 && (
                  <p className="text-sm text-stone-400 text-center py-8">No transactions this month yet.</p>
                )}
                {sortedMonthTx.map(renderRow)}
              </div>
            )}

            {viewMode === "calendar" && (
              <>
                <div className="bg-white border border-stone-200 rounded-2xl p-3 mb-4">
                  <div className="grid grid-cols-7 mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className="text-center text-xs text-stone-400 py-1">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarCells(selectedMonth).map((dateStr, i) => {
                      if (!dateStr) return <div key={i} />;
                      const dayTx = txByDay[dateStr] || [];
                      const isSelected = selectedDay === dateStr;
                      const isToday = dateStr === todayISO();
                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 border ${
                            isSelected
                              ? "bg-stone-800 border-stone-800"
                              : isToday
                              ? "border-stone-400"
                              : "border-transparent hover:bg-stone-50"
                          }`}
                        >
                          <span className={`text-xs ${isSelected ? "text-white" : "text-stone-600"}`}>
                            {dayNum(dateStr)}
                          </span>
                          <div className="flex gap-0.5">
                            {dayTx.slice(0, 3).map((t, idx) => (
                              <span
                                key={idx}
                                className="w-1 h-1 rounded-full"
                                style={{
                                  backgroundColor: t.type === "credit" ? "#3B7A57" : CATEGORY_COLORS[t.category],
                                }}
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100 overflow-hidden">
                  {!selectedDay && (
                    <p className="text-sm text-stone-400 text-center py-8">Tap a day to see its transactions.</p>
                  )}
                  {selectedDay && (txByDay[selectedDay] || []).length === 0 && (
                    <p className="text-sm text-stone-400 text-center py-8">No transactions on this day.</p>
                  )}
                  {selectedDay && (txByDay[selectedDay] || []).map(renderRow)}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex justify-center">
        <div className="w-full max-w-sm bg-white border-t border-stone-200 flex">
          <button
            onClick={() => setPage("overview")}
            className={`flex-1 py-3 text-sm font-medium flex flex-col items-center gap-1 ${
              page === "overview" ? "text-stone-800" : "text-stone-400"
            }`}
          >
            <Wallet size={18} />
            Overview
          </button>
          <button
            onClick={() => setPage("transactions")}
            className={`flex-1 py-3 text-sm font-medium flex flex-col items-center gap-1 ${
              page === "transactions" ? "text-stone-800" : "text-stone-400"
            }`}
          >
            <Plus size={18} />
            Transactions
          </button>
        </div>
      </div>

      {showTargetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h2 className="font-serif text-lg text-stone-800 mb-1">Set targets for {monthLabel(selectedMonth)}</h2>
            <p className="text-xs text-stone-400 mb-4">Total updates automatically as you go.</p>
            <div className="space-y-2 mb-4">
              {ALL_CATEGORIES.map((c) => (
                <div key={c} className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[c] }}
                  />
                  <label className="text-sm text-stone-600 w-28 shrink-0">{c}</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={draftTargets[c] ?? ""}
                    onChange={(e) => setDraftTargets((p) => ({ ...p, [c]: e.target.value }))}
                    placeholder="0"
                    className="flex-1 border border-stone-200 rounded-xl px-3 py-1.5 text-sm text-stone-700"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 pt-3 mb-4">
              <span className="text-sm font-medium text-stone-700">Total target</span>
              <span className="font-serif text-lg text-stone-800">{money(draftTotal)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTargetModal(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium border border-stone-200 text-stone-500"
              >
                Cancel
              </button>
              <button
                onClick={saveTargets}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-stone-800 text-white"
              >
                Save targets
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h2 className="font-serif text-lg text-stone-800 mb-1">Choose categories</h2>
            <p className="text-xs text-stone-400 mb-4">Pick what shows on the overview. Everything still counts toward your totals either way.</p>
            <div className="space-y-1 mb-4 max-h-72 overflow-y-auto">
              {ALL_CATEGORIES.map((c) => (
                <label key={c} className="flex items-center gap-3 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftVisible.includes(c)}
                    onChange={() => toggleDraftCategory(c)}
                    className="w-4 h-4 accent-stone-800"
                  />
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[c] }}
                  />
                  <span className="text-sm text-stone-700">{c}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium border border-stone-200 text-stone-500"
              >
                Cancel
              </button>
              <button
                onClick={saveVisibleCategories}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-stone-800 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DonutMini({ spent, target, color, size = 56 }) {
  const safeTarget = target > 0 ? target : Math.max(spent, 1);
  const filled = Math.min(spent, safeTarget);
  const remaining = Math.max(safeTarget - spent, 0);
  const data =
    spent === 0 && target === 0
      ? [{ name: "empty", value: 1 }]
      : [
          { name: "spent", value: filled },
          { name: "remaining", value: remaining },
        ];
  const colors = spent === 0 && target === 0 ? [TRACK_COLOR] : [color, TRACK_COLOR];
  return (
    <div style={{ width: size, height: size }} className="shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={size * 0.32}
            outerRadius={size * 0.48}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={colors[i]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}