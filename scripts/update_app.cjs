const fs = require('fs');

const appPath = 'e:\\New projects\\personal app\\src\\App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

// Replace Header and Outer Container
content = content.replace(
  /<motion\.div key="finance" variants=\{pageVariants\} initial="initial" animate="in" exit="out"\s*style=\{\{ padding: '28px 32px', height: '100%', overflowY: 'auto' \}\}>\s*\{\/\* ── HEADER ── \*\/\}\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' \}\}>\s*<div>\s*<h2 style=\{\{ fontSize: '1\.8rem', fontWeight: 700, color: 'var\(--primary\)', letterSpacing: '-0\.02em' \}\}>\s*Finance Dashboard\s*<\/h2>\s*<\/div>\s*<div style=\{\{ display: 'flex', alignItems: 'center', gap: '12px' \}\}>\s*<div style=\{\{ textAlign: 'right' \}\}>\s*<div style=\{\{ fontWeight: 600, fontSize: '0\.95rem', color: 'var\(--primary\)' \}\}>\{settings\.displayName\}<\/div>\s*<div style=\{\{ color: 'var\(--text-secondary\)', fontSize: '0\.8rem' \}\}>\s*\{new Date\(\)\.toLocaleDateString\('en-US', \{ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' \}\)\}\s*<\/div>\s*<\/div>\s*\{\/\* Using an image if available, else fallback to initials styled like a photo \*\/\}\s*<div style=\{\{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient\(135deg, #1e293b, #0f172a\)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1\.2rem', fontWeight: 700, border: '2px solid rgba\(255,255,255,0\.1\)', overflow: 'hidden' \}\}>\s*<img src=\{`https:\/\/ui-avatars\.com\/api\/\?name=\$\{settings\.displayName\}&background=3B82F6&color=fff&size=100`\} alt=\{settings\.displayName\} style=\{\{ width: '100%', height: '100%', objectFit: 'cover' \}\} \/>\s*<\/div>\s*<\/div>\s*<\/div>/g,
  `<motion.div key="finance" variants={pageVariants} initial="initial" animate="in" exit="out"
                className="finance-dashboard-card" style={{ padding: '0', height: '100%', overflowY: 'auto', margin: '0' }}>

                {/* ── HEADER ── */}
                <div className="finance-header">
                  <div>
                    <h2 className="finance-title">
                      Finance Dashboard
                    </h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div className="finance-user-name">{settings.displayName}</div>
                      <div className="finance-date">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    {/* Circular profile photo, ~40px diameter, thin white/light border ring */}
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3A3F47', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.4)', overflow: 'hidden' }}>
                       <img src={\`https://ui-avatars.com/api/?name=\${settings.displayName}&background=3B82F6&color=fff&size=100\`} alt={settings.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '24px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>`
);

// Close the inner div at the end of the finance tab
content = content.replace(
  /\{\/\* Add Goal Modal \*\/\}/,
  `</div>\n                {/* Add Goal Modal */}`
);

// Replace Stat Card 1
content = content.replace(
  /<div className="glass-panel" style=\{\{ padding: '22px', borderRadius: '18px', position: 'relative', overflow: 'hidden' \}\}>\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' \}\}>\s*<span style=\{\{ fontSize: '0\.9rem', color: 'var\(--text-secondary\)', fontWeight: 400 \}\}>Monthly<br\/>Income<\/span>\s*<div style=\{\{ color: 'var\(--accent-blue\)', opacity: 0\.8 \}\}>\s*<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"\/><circle cx="12" cy="12" r="2"\/><path d="M6 12h\.01M18 12h\.01"\/><\/svg>\s*<\/div>\s*<\/div>\s*<div style=\{\{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' \}\}>\s*<span style=\{\{ fontSize: '2rem', fontWeight: 700, color: 'var\(--text-primary\)' \}\}>Rs<\/span>\s*<input \s*type="number" \s*value=\{monthlyIncome \|\| ''\} \s*onChange=\{\(e\) => setMonthlyIncome\(Number\(e\.target\.value\)\)\}\s*placeholder="0"\s*style=\{\{ background: 'transparent', border: 'none', color: 'var\(--text-primary\)', fontSize: '2rem', fontWeight: 700, outline: 'none', width: '120px' \}\}\s*\/>\s*<\/div>\s*<div style=\{\{ fontSize: '0\.8rem', color: 'var\(--text-secondary\)' \}\}>\s*\{new Date\(\)\.toLocaleDateString\('en-US', \{ month: 'long', year: 'numeric' \}\)\}\s*<\/div>\s*<\/div>/g,
  `{/* Card 1: Monthly Income */}
                  <div className="finance-stat-card-1">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span className="finance-label">Monthly<br/>Income</span>
                      <div className="finance-icon-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span className="finance-big-num">Rs</span>
                      <input 
                        type="number" 
                        value={monthlyIncome || ''} 
                        onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                        placeholder="0"
                        className="finance-big-num"
                        style={{ background: 'transparent', border: 'none', outline: 'none', width: '120px', padding: 0 }}
                      />
                    </div>
                    <div className="finance-empty-subtitle">
                      {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>`
);

// Replace Stat Card 2
content = content.replace(
  /<div className="glass-panel" style=\{\{ padding: '22px', borderRadius: '18px', position: 'relative' \}\}>\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' \}\}>\s*<span style=\{\{ fontSize: '0\.9rem', color: 'var\(--text-secondary\)', fontWeight: 400 \}\}>This Month's<br\/>Expense<\/span>\s*<\/div>\s*<div style=\{\{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' \}\}>\s*<div style=\{\{ fontSize: '2rem', fontWeight: 700, color: 'var\(--text-primary\)', marginBottom: '4px' \}\}>Rs \{totalExpense\.toLocaleString\(\)\}<\/div>\s*\{\/\* Circular Progress SVG \*\/\}\s*<div style=\{\{ position: 'relative', width: '48px', height: '48px' \}\}>\s*<svg viewBox="0 0 36 36" style=\{\{ width: '100%', height: '100%', transform: 'rotate\(-90deg\)' \}\}>\s*<path d="M18 2\.0845 a 15\.9155 15\.9155 0 0 1 0 31\.831 a 15\.9155 15\.9155 0 0 1 0 -31\.831" fill="none" stroke="rgba\(255,255,255,0\.1\)" strokeWidth="3" \/>\s*<path d="M18 2\.0845 a 15\.9155 15\.9155 0 0 1 0 31\.831 a 15\.9155 15\.9155 0 0 1 0 -31\.831" fill="none" stroke="var\(--text-secondary\)" strokeWidth="3" strokeDasharray=\{`\$\{expensePercent\}, 100`\} \/>\s*<\/svg>\s*<div style=\{\{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0\.65rem', fontWeight: 600, color: 'var\(--text-primary\)' \}\}>\s*\{expensePercent\}%\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g,
  `<div className="finance-stat-card-1">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span className="finance-label">This Month's<br/>Expense</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <div className="finance-big-num" style={{ marginBottom: '4px' }}>Rs {totalExpense.toLocaleString()}</div>
                            
                            {/* Circular Progress SVG */}
                            <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#007DFE" strokeWidth="3" strokeDasharray={\`\${expensePercent}, 100\`} />
                              </svg>
                              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 600, color: '#F4F5F4' }}>
                                {expensePercent}%
                              </div>
                            </div>
                          </div>
                        </div>`
);

// Replace Stat Card 3
content = content.replace(
  /<div className="glass-panel" style=\{\{ padding: '22px', borderRadius: '18px' \}\}>\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' \}\}>\s*<span style=\{\{ fontSize: '0\.9rem', color: 'var\(--text-secondary\)', fontWeight: 400 \}\}>Est\. Monthly<br\/>Savings<\/span>\s*<\/div>\s*<div style=\{\{ fontSize: '2rem', fontWeight: 700, color: 'var\(--text-primary\)', marginBottom: '6px' \}\}>Rs \{monthlySavings\.toLocaleString\(\)\}<\/div>\s*<div style=\{\{ fontSize: '0\.8rem', color: 'var\(--text-secondary\)' \}\}>\s*<span style=\{\{ color: monthlySavings >= 0 \? '#10B981' : '#F43F5E', fontWeight: 500 \}\}>\s*\{monthlySavings >= 0 \? `\+\$\{monthlyIncome > 0 \? Math\.round\(\(monthlySavings\/monthlyIncome\)\*100\) : 0\}%` : 'Over budget'\}\s*<\/span> from last month\s*<\/div>\s*<\/div>/g,
  `<div className="finance-stat-card-2">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span className="finance-label">Est. Monthly<br/>Savings</span>
                          </div>
                          <div className="finance-big-num" style={{ marginBottom: '6px' }}>Rs {monthlySavings.toLocaleString()}</div>
                          <div className="finance-empty-subtitle">
                            <span style={{ color: monthlySavings >= 0 ? '#3C785E' : '#F43F5E', fontWeight: 600 }}>
                              {monthlySavings >= 0 ? \`+\${monthlyIncome > 0 ? Math.round((monthlySavings/monthlyIncome)*100) : 0}%\` : 'Over budget'}
                            </span> from last month
                          </div>
                        </div>`
);

// Replace Stat Card 4
content = content.replace(
  /<div className="glass-panel" style=\{\{ padding: '22px', borderRadius: '18px' \}\}>\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' \}\}>\s*<span style=\{\{ fontSize: '0\.9rem', color: 'var\(--text-secondary\)', fontWeight: 400 \}\}>Yearly Savings<br\/>Projection<\/span>\s*<div style=\{\{ color: 'var\(--accent-blue\)', opacity: 0\.8 \}\}>\s*<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13\.5 15\.5 8\.5 10\.5 2 17"\/><polyline points="16 7 22 7 22 13"\/><\/svg>\s*<\/div>\s*<\/div>\s*<div style=\{\{ fontSize: '2rem', fontWeight: 700, color: 'var\(--text-primary\)' \}\}>Rs \{yearlySavingsProj\.toLocaleString\(\)\}<\/div>\s*<\/div>/g,
  `<div className="finance-stat-card-2">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span className="finance-label">Yearly Savings<br/>Projection</span>
                            <div className="finance-icon-badge">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                            </div>
                          </div>
                          <div className="finance-big-num">Rs {yearlySavingsProj.toLocaleString()}</div>
                        </div>`
);

// Replace Panel 1 (Savings Goals)
content = content.replace(
  /<div className="glass-panel" style=\{\{ padding: '28px', borderRadius: '18px', display: 'flex', flexDirection: 'column', minHeight: '420px' \}\}>\s*<h3 style=\{\{ fontSize: '1\.15rem', fontWeight: 700, marginBottom: '20px' \}\}>Savings Goals \/ Wishlist<\/h3>/g,
  `<div className="finance-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '420px' }}>
                    <h3 className="finance-panel-heading" style={{ marginBottom: '20px' }}>Savings Goals / Wishlist</h3>`
);
content = content.replace(
  /<p style=\{\{ fontWeight: 600, fontSize: '1\.05rem', marginBottom: '6px', color: 'var\(--text-primary\)' \}\}>No savings goals yet\.<\/p>\s*<p style=\{\{ color: 'var\(--text-secondary\)', fontSize: '0\.9rem' \}\}>What are you saving up for\?<\/p>\s*<\/div>\s*<motion\.button whileHover=\{\{ scale: 1\.05 \}\} whileTap=\{\{ scale: 0\.95 \}\} onClick=\{\(\) => setShowAddGoal\(true\)\} style=\{\{ padding: '12px 36px', fontSize: '0\.95rem', borderRadius: '12px', background: 'var\(--accent-blue\)', boxShadow: '0 8px 24px rgba\(59,130,246,0\.4\)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontWeight: 600, marginTop: '8px' \}\}>\s*<Plus size=\{18\} \/> New Goal\s*<\/motion\.button>/g,
  `<p className="finance-empty-title" style={{ marginBottom: '6px' }}>No savings goals yet.</p>
                          <p className="finance-empty-subtitle">What are you saving up for?</p>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddGoal(true)} className="finance-btn-primary" style={{ marginTop: '16px' }}>
                          <Plus size={16} /> New Goal
                        </motion.button>`
);
content = content.replace(
  /<motion\.button whileHover=\{\{ scale: 1\.04 \}\} whileTap=\{\{ scale: 0\.96 \}\} onClick=\{\(\) => setShowAddGoal\(true\)\} style=\{\{ marginTop: '18px', padding: '10px', borderRadius: '10px', background: 'var\(--accent-blue\)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0\.9rem' \}\}>\s*<Plus size=\{16\} \/> New Goal\s*<\/motion\.button>/g,
  `<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddGoal(true)} className="finance-btn-primary" style={{ marginTop: '18px', width: '100%' }}>
                          <Plus size={16} /> New Goal
                        </motion.button>`
);

// Replace Panel 2 (Expenses)
content = content.replace(
  /<div className="glass-panel" style=\{\{ padding: '28px', borderRadius: '18px', display: 'flex', flexDirection: 'column', minHeight: '420px' \}\}>\s*<div style=\{\{ marginBottom: '4px' \}\}>\s*<h3 style=\{\{ fontSize: '1\.15rem', fontWeight: 700 \}\}>Expenses This Month<\/h3>\s*<p style=\{\{ color: 'var\(--text-secondary\)', fontSize: '0\.82rem', marginTop: '4px' \}\}>/g,
  `<div className="finance-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '420px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <h3 className="finance-panel-heading">Expenses This Month</h3>
                      <p className="finance-empty-subtitle" style={{ marginTop: '4px' }}>`
);
content = content.replace(
  /<p style=\{\{ fontWeight: 600, fontSize: '1\.05rem', marginBottom: '6px', color: 'var\(--text-primary\)' \}\}>No expenses yet\.<\/p>\s*<p style=\{\{ color: 'var\(--text-secondary\)', fontSize: '0\.9rem' \}\}>Click "\+ Add Expense" to start tracking\.<\/p>\s*<\/div>\s*<motion\.button whileHover=\{\{ scale: 1\.05 \}\} whileTap=\{\{ scale: 0\.95 \}\} onClick=\{\(\) => \{ setEditExpenseId\(null\); setNewExpense\(\{ name: '', amount: '', category: 'other', recurring: false \}\); setShowAddExpense\(true\); \}\} style=\{\{ padding: '12px 36px', fontSize: '0\.95rem', borderRadius: '12px', background: 'transparent', border: '1px solid rgba\(255,255,255,0\.2\)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontWeight: 600, marginTop: '8px' \}\}>\s*<Plus size=\{18\} \/> Add Expense\s*<\/motion\.button>/g,
  `<p className="finance-empty-title" style={{ marginBottom: '6px' }}>No expenses yet.</p>
                          <p className="finance-empty-subtitle">Click "+ Add Expense" to start tracking.</p>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setEditExpenseId(null); setNewExpense({ name: '', amount: '', category: 'other', recurring: false }); setShowAddExpense(true); }} className="finance-btn-secondary" style={{ marginTop: '16px' }}>
                          <Plus size={16} /> Add Expense
                        </motion.button>`
);
content = content.replace(
  /<motion\.button whileHover=\{\{ scale: 1\.04 \}\} whileTap=\{\{ scale: 0\.96 \}\} onClick=\{\(\) => \{ setEditExpenseId\(null\); setNewExpense\(\{ name: '', amount: '', category: 'other', recurring: false \}\); setShowAddExpense\(true\); \}\} style=\{\{ marginTop: '16px', padding: '10px', borderRadius: '10px', background: 'rgba\(255,255,255,0\.06\)', border: '1px solid rgba\(255,255,255,0\.1\)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0\.9rem' \}\}>\s*<Plus size=\{16\} \/> Add Expense\s*<\/motion\.button>/g,
  `<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setEditExpenseId(null); setNewExpense({ name: '', amount: '', category: 'other', recurring: false }); setShowAddExpense(true); }} className="finance-btn-secondary" style={{ marginTop: '16px', width: '100%' }}>
                          <Plus size={16} /> Add Expense
                        </motion.button>`
);


fs.writeFileSync(appPath, content);
console.log('App.tsx updated.');
