export interface PayslipData {
  orgName: string
  orgLogo?: string
  employeeName: string
  employeeCode: string
  designation: string
  department: string
  pan: string
  bankAccount: string
  ifsc: string
  payPeriod: string
  workingDays: number
  paidDays: number
  earnings: {
    basic: number
    hra: number
    allowances: number
    bonus: number
    gross: number
  }
  deductions: {
    pf: number
    esi: number
    pt: number
    tds: number
    total: number
  }
  netPayable: number
}

export default class PdfService {
  /**
   * Generate branded HTML document for payslip rendering / PDF conversion
   */
  static generatePayslipHtml(data: PayslipData): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${data.employeeName} - ${data.payPeriod}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
    .org-title { font-size: 24px; font-weight: 700; color: #0f172a; }
    .payslip-title { font-size: 18px; font-weight: 600; color: #475569; text-transform: uppercase; }
    .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; font-size: 14px; }
    .table-container { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #f1f5f9; color: #0f172a; text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e1; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .net-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; text-align: right; margin-top: 24px; }
    .net-amount { font-size: 22px; font-weight: 700; color: #1d4ed8; }
  </style>
</head>
<body>
  <div class="header">
    <div class="org-title">${data.orgName}</div>
    <div class="payslip-title">Payslip - ${data.payPeriod}</div>
  </div>

  <div class="section-grid">
    <div>
      <p><strong>Employee Name:</strong> ${data.employeeName}</p>
      <p><strong>Employee Code:</strong> ${data.employeeCode}</p>
      <p><strong>Designation:</strong> ${data.designation}</p>
      <p><strong>Department:</strong> ${data.department}</p>
    </div>
    <div>
      <p><strong>PAN:</strong> ${data.pan || 'N/A'}</p>
      <p><strong>Bank A/C:</strong> ${data.bankAccount || 'N/A'}</p>
      <p><strong>IFSC:</strong> ${data.ifsc || 'N/A'}</p>
      <p><strong>Paid Days:</strong> ${data.paidDays} / ${data.workingDays}</p>
    </div>
  </div>

  <table class="table-container">
    <thead>
      <tr>
        <th>Earnings</th>
        <th style="text-align: right;">Amount (₹)</th>
        <th>Deductions</th>
        <th style="text-align: right;">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Basic Salary</td>
        <td style="text-align: right;">₹${data.earnings.basic.toLocaleString('en-IN')}</td>
        <td>Provident Fund (PF)</td>
        <td style="text-align: right;">₹${data.deductions.pf.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>House Rent Allowance (HRA)</td>
        <td style="text-align: right;">₹${data.earnings.hra.toLocaleString('en-IN')}</td>
        <td>Employee ESI</td>
        <td style="text-align: right;">₹${data.deductions.esi.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Special Allowances</td>
        <td style="text-align: right;">₹${data.earnings.allowances.toLocaleString('en-IN')}</td>
        <td>Professional Tax (PT)</td>
        <td style="text-align: right;">₹${data.deductions.pt.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Statutory Bonus / Bonus</td>
        <td style="text-align: right;">₹${data.earnings.bonus.toLocaleString('en-IN')}</td>
        <td>Income Tax (TDS)</td>
        <td style="text-align: right;">₹${data.deductions.tds.toLocaleString('en-IN')}</td>
      </tr>
      <tr style="font-weight: bold; background: #f8fafc;">
        <td>Gross Earnings</td>
        <td style="text-align: right;">₹${data.earnings.gross.toLocaleString('en-IN')}</td>
        <td>Total Deductions</td>
        <td style="text-align: right;">₹${data.deductions.total.toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>

  <div class="net-box">
    <div>Net Salary Payable</div>
    <div class="net-amount">₹${data.netPayable.toLocaleString('en-IN')}</div>
  </div>
</body>
</html>`
  }
}
