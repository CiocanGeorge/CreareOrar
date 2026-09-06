import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchEmployees, 
  fetchShifts, 
  fetchMissingHours,
  createEmployee, 
  updateEmployee, 
  deleteEmployee,
  createShift,
  createMissingHour
} from '../lib/databaseService';
import EmployeeList from '../components/employees/EmployeeList';
import EmployeeForm from '../components/employees/EmployeeForm';
import ShiftForm from '../components/schedule/ShiftForm';
import MissingHoursModal from '../components/missingHours/MissingHoursModal';
import { Users, Loader2 } from 'lucide-react';

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [missingHours, setMissingHours] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stări modale
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);

  // Modal adăugare tură directă
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState(null);

  // Modal adăugare ore lipsă direct pentru un angajat
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [targetMissingEmpId, setTargetMissingEmpId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empsData, shiftsData, missingData] = await Promise.all([
        fetchEmployees(user?.id),
        fetchShifts(user?.id),
        fetchMissingHours(user?.id),
      ]);
      setEmployees(empsData);
      setShifts(shiftsData);
      setMissingHours(missingData);
    } catch (err) {
      console.error('Eroare la încărcarea angajaților:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSaveEmployee = async (employeeData) => {
    if (employeeToEdit) {
      await updateEmployee(employeeToEdit.id, employeeData);
    } else {
      await createEmployee({ ...employeeData, user_id: user?.id });
    }
    loadData();
  };

  const handleDeleteEmployee = async (id) => {
    await deleteEmployee(id);
    loadData();
  };

  const handleOpenAdd = () => {
    setEmployeeToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEmployeeToEdit(emp);
    setIsFormOpen(true);
  };

  const handleAddShiftForEmployee = (emp) => {
    setTargetEmployeeId(emp.id);
    setIsShiftModalOpen(true);
  };

  const handleAddMissingForEmployee = (emp) => {
    setTargetMissingEmpId(emp.id);
    setIsMissingModalOpen(true);
  };

  const handleSaveShift = async (shiftData) => {
    await createShift({ ...shiftData, user_id: user?.id });
    loadData();
  };

  const handleSaveMissingHour = async (recordData) => {
    await createMissingHour({ ...recordData, user_id: user?.id });
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-600" />
            Gestionare Angajați
          </h1>
          <p className="text-sm text-slate-500">
            Adaugă membrii echipei, monitorizează normele săptămânale, orele de recuperat și atribuie ture.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
          <p className="text-xs text-slate-500">Se încarcă lista de angajați...</p>
        </div>
      ) : (
        <EmployeeList
          employees={employees}
          shifts={shifts}
          missingHours={missingHours}
          onAddEmployee={handleOpenAdd}
          onEditEmployee={handleOpenEdit}
          onDeleteEmployee={handleDeleteEmployee}
          onAddShiftForEmployee={handleAddShiftForEmployee}
          onAddMissingForEmployee={handleAddMissingForEmployee}
        />
      )}

      {/* Formular Angajat */}
      <EmployeeForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveEmployee}
        employeeToEdit={employeeToEdit}
      />

      {/* Formular Tură Rapidă per Angajat */}
      <ShiftForm
        isOpen={isShiftModalOpen}
        onClose={() => {
          setIsShiftModalOpen(false);
          setTargetEmployeeId(null);
        }}
        onSave={handleSaveShift}
        employees={employees}
        shifts={shifts}
        preselectedEmployeeId={targetEmployeeId}
      />

      {/* Formular Ore Lipsă Rapid per Angajat */}
      <MissingHoursModal
        isOpen={isMissingModalOpen}
        onClose={() => {
          setIsMissingModalOpen(false);
          setTargetMissingEmpId(null);
        }}
        onSave={handleSaveMissingHour}
        employees={employees}
        preselectedEmployeeId={targetMissingEmpId}
      />
    </div>
  );
}
