import { calculateShiftHours, formatTimeShort } from './timeCalculations';
import { MONTH_NAMES_RO, DAYS_NAMES_RO, DAYS_SHORT_RO, getDaysInMonth, getCalendarMatrix, getWeekDaysForDate } from './monthCalculations';
import { resolveShiftStyleAndLabel } from './shiftTemplateHelpers';

/**
 * Declanșează descărcarea unui fișier în browser (CSV, TXT, etc.)
 */
export function downloadFile(filename, content, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Evadează un câmp pentru formatul CSV (Excel compatible)
 */
function escapeCsv(value) {
  if (value === undefined || value === null) return '""';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generează CSV tip matrice pe săptămână (zile pe coloane)
 */
export function buildWeeklyMatrixCsv({ weekDays, employees, shifts, templates, missingHours = [], filterEmployeeId = 'all' }) {
  const targetEmployees = filterEmployeeId === 'all'
    ? employees
    : employees.filter((e) => e.id === filterEmployeeId);

  const weekDatesList = weekDays.map((d) => d.dateString);
  const weekLabel = `${weekDays[0].formattedDate} - ${weekDays[6].formattedDate}`;

  const rows = [];
  
  // Header titlu
  rows.push([escapeCsv(`ORAR SĂPTĂMÂNAL: ${weekLabel}`), escapeCsv(`Generat la: ${new Date().toLocaleDateString('ro-RO')}`)]);
  rows.push([]);

  // Header coloane
  const headerCols = [
    escapeCsv('Nume Angajat'),
    escapeCsv('Rol / Funcție')
  ];
  weekDays.forEach((d) => {
    headerCols.push(escapeCsv(`${d.dayName} (${d.formattedDate})`));
  });
  headerCols.push(escapeCsv('Total Ore Programate'));
  rows.push(headerCols);

  targetEmployees.forEach((emp) => {
    const empShifts = shifts.filter((s) => {
      if (s.employee_id !== emp.id) return false;
      if (s.shift_date) return weekDatesList.includes(s.shift_date);
      return false;
    });

    let empWeeklyHours = 0;
    const empRow = [
      escapeCsv(`${emp.first_name} ${emp.last_name}`),
      escapeCsv(emp.role || 'Angajat')
    ];

    weekDays.forEach((day) => {
      const dayShifts = empShifts.filter((s) => s.shift_date === day.dateString);
      if (dayShifts.length === 0) {
        empRow.push(escapeCsv(day.isWeekend ? 'Liber (W)' : 'Liber'));
      } else {
        const shiftsText = dayShifts.map((s) => {
          const hours = calculateShiftHours(s.start_time, s.end_time);
          empWeeklyHours += hours;
          const tpl = resolveShiftStyleAndLabel(s, templates);
          const labelSuffix = tpl.label && tpl.label !== 'Tură' ? ` - ${tpl.label}` : '';
          return `${formatTimeShort(s.start_time)}-${formatTimeShort(s.end_time)} (${hours}h${labelSuffix})`;
        }).join(' | ');
        empRow.push(escapeCsv(shiftsText));
      }
    });

    empRow.push(escapeCsv(`${Math.round(empWeeklyHours * 10) / 10}h`));
    rows.push(empRow);
  });

  // UTF-8 BOM pentru deschidere corectă a diacriticelor în Excel
  return '\uFEFF' + rows.map((r) => r.join(';')).join('\r\n');
}

/**
 * Generează CSV tip matrice pe lună împărțit pe săptămâni (o săptămână pe un rând nou)
 */
export function buildMonthlyMatrixCsv({
  year,
  month,
  employees,
  shifts,
  templates,
  missingHours = [],
  filterEmployeeId = 'all'
}) {
  const targetEmployees = filterEmployeeId === 'all'
    ? employees
    : employees.filter((e) => e.id === filterEmployeeId);

  const monthName = MONTH_NAMES_RO[month];
  const targetPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const weeks = getCalendarMatrix(year, month);

  const rows = [];

  // =========================================================================
  // DACĂ ESTE FILTRAT UN SINGUR ANGAJAT
  // =========================================================================
  if (filterEmployeeId !== 'all' && targetEmployees.length === 1) {
    const emp = targetEmployees[0];
    const empMonthShifts = shifts.filter(
      (s) => s.employee_id === emp.id && s.shift_date && s.shift_date.startsWith(targetPrefix)
    );
    const empMonthlyHours = Math.round(
      empMonthShifts.reduce((acc, s) => acc + calculateShiftHours(s.start_time, s.end_time), 0) * 10
    ) / 10;

    rows.push([
      escapeCsv(`ORAR: ${emp.first_name} ${emp.last_name} (${emp.role || 'Angajat'})`),
      escapeCsv(`Luna: ${monthName.toUpperCase()} ${year}`),
      escapeCsv(`Generat la: ${new Date().toLocaleDateString('ro-RO')}`)
    ]);
    rows.push([]);

    // Header tabel: 1 rând per săptămână
    const headerCols = [
      escapeCsv('Săptămână'),
      escapeCsv('Interval Calendaristic'),
      escapeCsv('Luni'),
      escapeCsv('Marți'),
      escapeCsv('Miercuri'),
      escapeCsv('Joi'),
      escapeCsv('Vineri'),
      escapeCsv('Sâmbătă'),
      escapeCsv('Duminică'),
      escapeCsv('Total Ore Săpt.')
    ];
    rows.push(headerCols);

    // Rânduri: o săptămână pe un rând nou
    weeks.forEach((weekDays, wIdx) => {
      const startParts = weekDays[0].dateString.split('-');
      const endParts = weekDays[6].dateString.split('-');
      const weekRange = `${startParts[2]}.${startParts[1]} - ${endParts[2]}.${endParts[1]}`;
      const weekDatesList = weekDays.map((d) => d.dateString);

      const empWeekShifts = shifts.filter(
        (s) => s.employee_id === emp.id && s.shift_date && weekDatesList.includes(s.shift_date)
      );

      let weekHours = 0;
      const weekRow = [
        escapeCsv(`Săptămâna ${wIdx + 1}`),
        escapeCsv(weekRange)
      ];

      weekDays.forEach((day) => {
        const dayShifts = empWeekShifts.filter((s) => s.shift_date === day.dateString);
        if (dayShifts.length === 0) {
          weekRow.push(escapeCsv(day.isPadding ? '-' : (day.isWeekend ? 'Liber (W)' : 'Liber')));
        } else {
          const shiftText = dayShifts.map((s) => {
            const hours = calculateShiftHours(s.start_time, s.end_time);
            weekHours += hours;
            const tpl = resolveShiftStyleAndLabel(s, templates);
            const labelSuffix = tpl.label && tpl.label !== 'Tură' ? ` - ${tpl.label}` : '';
            const padSuffix = day.isPadding ? ' [altă lună]' : '';
            return `${formatTimeShort(s.start_time)}-${formatTimeShort(s.end_time)} (${hours}h${labelSuffix})${padSuffix}`;
          }).join(' | ');
          weekRow.push(escapeCsv(shiftText));
        }
      });

      weekHours = Math.round(weekHours * 10) / 10;
      weekRow.push(escapeCsv(`${weekHours}h`));

      rows.push(weekRow);
    });

    // Subtotal lunar
    rows.push([]);
    const subtotalRow = [
      escapeCsv(`TOTAL LUNĂ: ${emp.first_name} ${emp.last_name}`),
      escapeCsv(`Toate cele ${weeks.length} săptămâni (${monthName} ${year})`),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv(`${empMonthlyHours}h`)
    ];
    rows.push(subtotalRow);

    return '\uFEFF' + rows.map((r) => r.join(';')).join('\r\n');
  }

  // =========================================================================
  // DACĂ SUNT SELECTAȚI TOȚI ANGAJAȚII:
  // DETALIERE PONTAJ PER ANGAJAT (FIECARE SĂPTĂMÂNĂ PE UN RÂND NOU)
  // =========================================================================
  rows.push([
    escapeCsv(`ORAR: ${monthName.toUpperCase()} ${year}`),
    escapeCsv(`Generat la: ${new Date().toLocaleDateString('ro-RO')}`),
    escapeCsv(`${targetEmployees.length} angajați`)
  ]);
  rows.push([]);

  const empTableHeaders = [
    escapeCsv('Nume Angajat'),
    escapeCsv('Rol / Funcție'),
    escapeCsv('Săptămână'),
    escapeCsv('Interval Calendaristic'),
    escapeCsv('Luni'),
    escapeCsv('Marți'),
    escapeCsv('Miercuri'),
    escapeCsv('Joi'),
    escapeCsv('Vineri'),
    escapeCsv('Sâmbătă'),
    escapeCsv('Duminică'),
    escapeCsv('Total Ore Săpt.')
  ];
  rows.push(empTableHeaders);

  targetEmployees.forEach((emp) => {
    const empMonthShifts = shifts.filter(
      (s) => s.employee_id === emp.id && s.shift_date && s.shift_date.startsWith(targetPrefix)
    );
    const empMonthlyHours = Math.round(
      empMonthShifts.reduce((acc, s) => acc + calculateShiftHours(s.start_time, s.end_time), 0) * 10
    ) / 10;

    weeks.forEach((weekDays, wIdx) => {
      const startParts = weekDays[0].dateString.split('-');
      const endParts = weekDays[6].dateString.split('-');
      const weekRange = `${startParts[2]}.${startParts[1]} - ${endParts[2]}.${endParts[1]}`;
      const weekDatesList = weekDays.map((d) => d.dateString);

      const empWeekShifts = shifts.filter(
        (s) => s.employee_id === emp.id && s.shift_date && weekDatesList.includes(s.shift_date)
      );

      let weekHours = 0;
      const weekRow = [
        escapeCsv(`${emp.first_name} ${emp.last_name}`),
        escapeCsv(emp.role || 'Angajat'),
        escapeCsv(`Săptămâna ${wIdx + 1}`),
        escapeCsv(weekRange)
      ];

      weekDays.forEach((day) => {
        const dayShifts = empWeekShifts.filter((s) => s.shift_date === day.dateString);
        if (dayShifts.length === 0) {
          weekRow.push(escapeCsv(day.isPadding ? '-' : (day.isWeekend ? 'Liber (W)' : 'Liber')));
        } else {
          const shiftText = dayShifts.map((s) => {
            const hours = calculateShiftHours(s.start_time, s.end_time);
            weekHours += hours;
            const tpl = resolveShiftStyleAndLabel(s, templates);
            const labelSuffix = tpl.label && tpl.label !== 'Tură' ? ` - ${tpl.label}` : '';
            const padSuffix = day.isPadding ? ' [altă lună]' : '';
            return `${formatTimeShort(s.start_time)}-${formatTimeShort(s.end_time)} (${hours}h${labelSuffix})${padSuffix}`;
          }).join(' | ');
          weekRow.push(escapeCsv(shiftText));
        }
      });

      weekHours = Math.round(weekHours * 10) / 10;
      weekRow.push(escapeCsv(`${weekHours}h`));

      rows.push(weekRow);
    });

    // Subtotal angajat
    const empSubtotalRow = [
      escapeCsv(`TOTAL LUNĂ: ${emp.first_name} ${emp.last_name}`),
      escapeCsv(emp.role || 'Angajat'),
      escapeCsv(`Toate cele ${weeks.length} săptămâni`),
      escapeCsv(`${monthName} ${year}`),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv(`${empMonthlyHours}h`)
    ];
    rows.push(empSubtotalRow);
    rows.push([]);
  });

  return '\uFEFF' + rows.map((r) => r.join(';')).join('\r\n');
}

/**
 * Generează CSV detaliat listă de ture (pe săptămână sau lună)
 */
export function buildDetailedShiftsCsv({ shifts, employees, templates, title = 'Raport Ture' }) {
  const rows = [];
  rows.push([escapeCsv(title), escapeCsv(`Generat la: ${new Date().toLocaleDateString('ro-RO')}`)]);
  rows.push([]);

  rows.push([
    escapeCsv('Data'),
    escapeCsv('Ziua'),
    escapeCsv('Nume Angajat'),
    escapeCsv('Rol'),
    escapeCsv('Ora Început'),
    escapeCsv('Ora Sfârșit'),
    escapeCsv('Durată (Ore)'),
    escapeCsv('Tip Tură')
  ]);

  const sortedShifts = [...shifts].sort((a, b) => {
    const dComp = (a.shift_date || '').localeCompare(b.shift_date || '');
    if (dComp !== 0) return dComp;
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  let totalDuration = 0;

  sortedShifts.forEach((s) => {
    const emp = employees.find((e) => e.id === s.employee_id);
    const hours = calculateShiftHours(s.start_time, s.end_time);
    totalDuration += hours;
    const tpl = resolveShiftStyleAndLabel(s, templates);

    const dateObj = s.shift_date ? new Date(s.shift_date + 'T00:00:00') : null;
    const dayName = dateObj ? DAYS_NAMES_RO[(dateObj.getDay() + 6) % 7] : '-';

    rows.push([
      escapeCsv(s.shift_date || '-'),
      escapeCsv(dayName),
      escapeCsv(emp ? `${emp.first_name} ${emp.last_name}` : 'Necunoscut'),
      escapeCsv(emp?.role || '-'),
      escapeCsv(formatTimeShort(s.start_time)),
      escapeCsv(formatTimeShort(s.end_time)),
      escapeCsv(hours),
      escapeCsv(tpl.label)
    ]);
  });

  rows.push([]);
  rows.push([escapeCsv('TOTAL ORE'), escapeCsv(''), escapeCsv(''), escapeCsv(''), escapeCsv(''), escapeCsv(''), escapeCsv(Math.round(totalDuration * 10) / 10), escapeCsv('')]);

  return '\uFEFF' + rows.map((r) => r.join(';')).join('\r\n');
}

/**
 * Tipărește raportul săptămânal gata stilizat pentru imprimantă / PDF
 */
export function printScheduleReport({ title, subtitle, days, employees, shifts, templates, missingHours = [], filterEmployeeId = 'all' }) {
  const targetEmployees = filterEmployeeId === 'all'
    ? employees
    : employees.filter((e) => e.id === filterEmployeeId);

  const datesList = days.map((d) => d.dateString);

  const rowsHtml = targetEmployees.map((emp) => {
    const empShifts = shifts.filter((s) => {
      if (s.employee_id !== emp.id) return false;
      if (s.shift_date) return datesList.includes(s.shift_date);
      return false;
    });

    let empTotalHours = 0;

    const cellsHtml = days.map((d) => {
      const dayShifts = empShifts.filter((s) => s.shift_date === d.dateString);
      if (dayShifts.length === 0) {
        return `<td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center; color: #94a3b8; font-size: 8px; background: ${d.isWeekend ? '#f8fafc' : 'white'};">${d.isWeekend ? 'Lib' : '-'}</td>`;
      }
      const text = dayShifts.map((s) => {
        const hours = calculateShiftHours(s.start_time, s.end_time);
        empTotalHours += hours;
        return `<div><b>${formatTimeShort(s.start_time)}-${formatTimeShort(s.end_time)}</b> <span style="color:#047857; font-size: 7px;">(${hours}h)</span></div>`;
      }).join('');

      return `<td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center; font-size: 8px; background: #f0fdf4;">${text}</td>`;
    }).join('');

    const roundedEmpHours = Math.round(empTotalHours * 10) / 10;

    return `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; font-weight: bold; white-space: nowrap; font-size: 9px;">
          ${emp.first_name} ${emp.last_name}
          <div style="font-size: 7px; color: #64748b; font-weight: normal;">${emp.role || 'Angajat'}</div>
        </td>
        ${cellsHtml}
        <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-weight: bold; font-size: 9px; background: #f1f5f9;">
          ${roundedEmpHours}h
        </td>
      </tr>
    `;
  }).join('');

  const headersHtml = days.map((d) => `
    <th style="border: 1px solid #cbd5e1; padding: 4px; font-size: 8px; background: ${d.isWeekend ? '#f1f5f9' : '#e2e8f0'}; min-width: 48px;">
      <div>${d.dayNameShort || d.dayName}</div>
      <div style="font-size: 7px; color: #64748b;">${d.formattedDate || d.dayNumber}</div>
    </th>
  `).join('');

  const printHtml = `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8">
      <title>${title || 'Program de Lucru'}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 10mm 8mm;
          color: #1e293b;
        }
        @page {
          size: landscape;
          margin: 8mm;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #059669;
          padding-bottom: 6px;
          margin-bottom: 10px;
        }
        .title {
          font-size: 16px;
          font-weight: 800;
          color: #065f46;
          margin: 0;
        }
        .subtitle {
          font-size: 10px;
          color: #475569;
          margin-top: 2px;
        }
        .meta {
          text-align: right;
          font-size: 8px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">${title || 'Program de Lucru'}</h1>
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        </div>
        <div class="meta">
          <div><b>Generat la:</b> ${new Date().toLocaleDateString('ro-RO')} ${new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="border: 1px solid #cbd5e1; padding: 5px; font-size: 9px; background: #e2e8f0; text-align: left; width: 140px;">
              Angajat
            </th>
            ${headersHtml}
            <th style="border: 1px solid #cbd5e1; padding: 5px; font-size: 9px; background: #e2e8f0; width: 65px;">
              Total Ore
            </th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  }
}

/**
 * Tipărește raportul lunar împărțit pe săptămâni (o săptămână pe un rând nou)
 */
export function printMonthlyScheduleReport({
  title,
  subtitle,
  year,
  month,
  employees,
  shifts,
  templates,
  missingHours = [],
  filterEmployeeId = 'all'
}) {
  const targetEmployees = filterEmployeeId === 'all'
    ? employees
    : employees.filter((e) => e.id === filterEmployeeId);

  const monthName = MONTH_NAMES_RO[month];
  const targetPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const weeks = getCalendarMatrix(year, month);
  const displayTitle = title || `Luna ${monthName} ${year}`;

  // Construim rândurile pentru fiecare angajat: fiecare săptămână pe un rând nou!
  const rowsHtml = targetEmployees.map((emp) => {
    const empMonthShifts = shifts.filter((s) => {
      if (s.employee_id !== emp.id) return false;
      if (s.shift_date) return s.shift_date.startsWith(targetPrefix);
      return false;
    });

    const empMonthlyHours = Math.round(
      empMonthShifts.reduce((acc, s) => acc + calculateShiftHours(s.start_time, s.end_time), 0) * 10
    ) / 10;

    const weeksHtml = weeks.map((weekDays, wIdx) => {
      const startParts = weekDays[0].dateString.split('-');
      const endParts = weekDays[6].dateString.split('-');
      const weekRange = `${startParts[2]}.${startParts[1]} - ${endParts[2]}.${endParts[1]}`;
      const weekDatesList = weekDays.map((d) => d.dateString);

      const empWeekShifts = shifts.filter((s) => {
        if (s.employee_id !== emp.id) return false;
        if (s.shift_date) return weekDatesList.includes(s.shift_date);
        return false;
      });

      let weekHours = 0;

      const dayCells = weekDays.map((day) => {
        const dayShifts = empWeekShifts.filter((s) => s.shift_date === day.dateString);
        if (dayShifts.length === 0) {
          return `<td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center; color: #94a3b8; font-size: 8px; background: ${day.isPadding ? '#f8fafc' : (day.isWeekend ? '#fafafa' : 'white')};">${day.isPadding ? '-' : (day.isWeekend ? 'Lib' : '-')}</td>`;
        }
        const text = dayShifts.map((s) => {
          const hours = calculateShiftHours(s.start_time, s.end_time);
          weekHours += hours;
          return `<div><b>${formatTimeShort(s.start_time)}-${formatTimeShort(s.end_time)}</b> <span style="color:#047857; font-size: 7px;">(${hours}h)</span></div>`;
        }).join('');

        return `<td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center; font-size: 8px; background: #f0fdf4;">${text}</td>`;
      }).join('');

      weekHours = Math.round(weekHours * 10) / 10;

      return `
        <tr>
          ${wIdx === 0 ? `
            <td rowspan="${weeks.length + 1}" style="border: 1px solid #cbd5e1; padding: 5px; font-weight: bold; vertical-align: top; font-size: 9px; background: white;">
              <div>${emp.first_name} ${emp.last_name}</div>
              <div style="font-size: 7px; color: #64748b; font-weight: normal; margin-top: 2px;">${emp.role || 'Angajat'}</div>
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #e2e8f0; font-size: 8px; color: #065f46;">
                <b>Total lună:</b> ${empMonthlyHours}h
              </div>
            </td>
          ` : ''}
          <td style="border: 1px solid #cbd5e1; padding: 3px 5px; font-size: 8px; font-weight: 600; background: #f8fafc; white-space: nowrap;">
            Săpt. ${wIdx + 1}
            <div style="font-size: 7px; color: #64748b; font-weight: normal;">${weekRange}</div>
          </td>
          ${dayCells}
          <td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center; font-weight: bold; font-size: 8px; background: #f1f5f9;">
            ${weekHours}h
          </td>
        </tr>
      `;
    }).join('');

    // Rând subtotal lunar per angajat
    const empSubtotalHtml = `
      <tr style="background: #f1f5f9; font-weight: bold; border-bottom: 2px solid #cbd5e1;">
        <td style="border: 1px solid #cbd5e1; padding: 3px 5px; font-size: 8px; color: #334155;">
          TOTAL LUNĂ
        </td>
        <td colspan="7" style="border: 1px solid #cbd5e1; padding: 3px 6px; text-align: right; font-size: 8px; color: #64748b;">
          Toate cele ${weeks.length} săptămâni (${monthName} ${year})
        </td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center; font-size: 9px; color: #065f46; font-weight: 800; background: #e2e8f0;">
          ${empMonthlyHours}h
        </td>
      </tr>
    `;

    return weeksHtml + empSubtotalHtml;
  }).join('');

  const printHtml = `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8">
      <title>${displayTitle}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 8mm 6mm;
          color: #1e293b;
        }
        @page {
          size: landscape;
          margin: 6mm;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #059669;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }
        .title {
          font-size: 15px;
          font-weight: 800;
          color: #065f46;
          margin: 0;
        }
        .subtitle {
          font-size: 9px;
          color: #475569;
          margin-top: 2px;
        }
        .meta {
          text-align: right;
          font-size: 8px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">${displayTitle}</h1>
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        </div>
        <div class="meta">
          <div><b>Generat la:</b> ${new Date().toLocaleDateString('ro-RO')} ${new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="border: 1px solid #cbd5e1; padding: 4px; font-size: 8px; background: #e2e8f0; text-align: left; width: 130px;">
              Angajat
            </th>
            <th style="border: 1px solid #cbd5e1; padding: 4px; font-size: 8px; background: #e2e8f0; width: 85px;">
              Săptămână
            </th>
            <th style="border: 1px solid #cbd5e1; padding: 4px; font-size: 8px; background: #e2e8f0;">Luni</th>
            <th style="border: 1px solid #cbd5e1; padding: 4px; font-size: 8px; background: #e2e8f0;">Marți</th>
            <th style="border: 1px solid #cbd5e1; padding: 4px; font-size: 8px; background: #e2e8f0;">Miercuri</th>
            <th style="border: 1px solid #cbd5e1; padding: 4px; font-size: 8px; background: #e2e8f0;">Joi</th>
            <th style="border: 1px solid #cbd5e1; padding: 4px; font-size: 8px; background: #e2e8f0;">Vineri</th>
            <th style="border: 1px solid #cbd5e1; padding: 4px; font-size: 8px; background: #f1f5f9;">Sâmbătă</th>
            <th style="border: 1px solid #cbd5e1; padding: 4px; font-size: 8px; background: #f1f5f9;">Duminică</th>
            <th style="border: 1px solid #cbd5e1; padding: 4px; font-size: 8px; background: #e2e8f0; width: 65px;">
              Total Săpt.
            </th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  }
}

