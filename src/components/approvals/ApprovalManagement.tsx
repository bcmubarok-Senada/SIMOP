import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { ApprovalRequest, ApprovalType, ApprovalStatus, SenadaCategoryCode } from '../../types';
import { isAdminRole, isTLRole, TL_ROLES, getRoleBadgeClass, SHIFT_DEFINITIONS, SENADA_CATEGORIES } from '../../utils/constants';
import {
  CheckCircle2, XCircle, Clock, AlertCircle, Plus,
  FileText, ArrowLeftRight, Calendar, User, Search, Filter, Layers, RefreshCw, Check
} from 'lucide-react';
import { Modal } from '../ui/Modal';

export const ApprovalManagement: React.FC = () => {
  const { currentUser, addToast, refreshData } = useAuth();
  const isAdmin = currentUser ? isAdminRole(currentUser.role) : false;
  const isKoordinator = currentUser?.role === 'KOORDINATOR';
  const isTL = currentUser ? isTLRole(currentUser.role) : false;

  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() =>
    storageService.getApprovals()
  );
  const allUsers = storageService.getUsers();
  const schedules = storageService.getSchedules();

  // TL users list
  const tlUsersList = useMemo(() => {
    return allUsers.filter(u => u.role === 'TL' || u.role.startsWith('TL'));
  }, [allUsers]);

  // Default target TL based on current user's team
  const defaultTargetTl = useMemo(() => {
    if (!currentUser) return 'TL 1';
    if (currentUser.teamId === 'team-2') return 'TL 2';
    if (currentUser.teamId === 'team-3') return 'TL 3';
    if (currentUser.teamId === 'team-4') return 'TL 4';
    if (currentUser.teamId === 'team-5') return 'TL 5';
    if (currentUser.teamId === 'team-6') return 'TL 6';
    return 'TL 1';
  }, [currentUser]);

  // Filters
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterTargetTl, setFilterTargetTl] = useState<string>('ALL');
  const [tlScopeFilter, setTlScopeFilter] = useState<'MY_TL' | 'ALL'>('MY_TL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Request Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reqType, setReqType] = useState<ApprovalType>('Cuti');
  const [reqTargetTlRole, setReqTargetTlRole] = useState<string>(defaultTargetTl);
  const [reqStartDate, setReqStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [reqEndDate, setReqEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [reqReason, setReqReason] = useState('');

  // Reset target TL default when modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      setReqTargetTlRole(defaultTargetTl);
    }
  }, [isCreateModalOpen, defaultTargetTl]);

  // Fields for Tukar Shift
  const [reqSwapUserId, setReqSwapUserId] = useState('');
  const [reqSwapDate, setReqSwapDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [reqOriginalShiftA, setReqOriginalShiftA] = useState('P1');
  const [reqProposedShiftA, setReqProposedShiftA] = useState('P2');

  // Fields for Perubahan Shift
  const [reqTargetShift, setReqTargetShift] = useState('P2');

  // Fields for Perubahan Kategori
  const [reqOriginalCategory, setReqOriginalCategory] = useState<string>('PM');
  const [reqTargetCategory, setReqTargetCategory] = useState<string>('IP');

  // Auto-detect shifts and categories on date/user change
  useEffect(() => {
    if (currentUser) {
      const userSched = schedules.find(s => s.userId === currentUser.id && s.date === reqStartDate);
      if (userSched) {
        setReqOriginalShiftA(userSched.shiftCode);
      }
      const senadaList = storageService.getSenadaAssignments();
      const userSenada = senadaList.find(s => s.userId === currentUser.id && s.date === reqStartDate);
      if (userSenada) {
        setReqOriginalCategory(userSenada.category);
      }
    }
  }, [reqStartDate, currentUser?.id, isCreateModalOpen]);

  useEffect(() => {
    if (reqSwapUserId) {
      const partnerSched = schedules.find(s => s.userId === reqSwapUserId && s.date === reqSwapDate);
      if (partnerSched) {
        setReqProposedShiftA(partnerSched.shiftCode);
      }
    }
  }, [reqSwapUserId, reqSwapDate]);

  // Action Modal (Approve / Reject) state
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [adminNotes, setAdminNotes] = useState('');

  const reloadData = () => {
    setApprovals(storageService.getApprovals());
    refreshData();
  };

  // Filtered approvals
  const filteredApprovals = useMemo(() => {
    return approvals.filter(item => {
      // Permission checks
      if (isKoordinator) {
        // Koordinator can view all approvals
      } else if (isTL) {
        // TL can see approvals targeted to their specific TL role or user ID,
        // or approvals created by them, or swap requests involving them
        if (tlScopeFilter === 'MY_TL') {
          const isTargetedToMe =
            item.targetTlRole === currentUser?.role ||
            item.targetTlUserId === currentUser?.id ||
            (!item.targetTlRole && item.teamId === currentUser?.teamId);
          const isMyOwn = item.userId === currentUser?.id || item.swapWithUserId === currentUser?.id;
          if (!isTargetedToMe && !isMyOwn) return false;
        }
      } else {
        // Petugas or QA can only view own requests or swap partner requests
        if (item.userId !== currentUser?.id && item.swapWithUserId !== currentUser?.id) {
          return false;
        }
      }

      const matchType = filterType === 'ALL' || item.type === filterType;
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
      const matchTargetTl =
        filterTargetTl === 'ALL' ||
        item.targetTlRole === filterTargetTl;

      const matchSearch =
        item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.targetTlRole && item.targetTlRole.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.targetTlUserName && item.targetTlUserName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.swapWithUserName && item.swapWithUserName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchType && matchStatus && matchTargetTl && matchSearch;
    });
  }, [approvals, isKoordinator, isTL, tlScopeFilter, currentUser, filterType, filterStatus, filterTargetTl, searchQuery]);

  // Handle submit new request
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!reqReason.trim()) {
      addToast('Alasan permohonan wajib diisi.', 'error');
      return;
    }

    if (reqType === 'Tukar Jadwal') {
      if (!reqSwapUserId) {
        addToast('Silakan pilih rekan petugas untuk tukar jadwal.', 'error');
        return;
      }
      if (reqSwapUserId === currentUser.id) {
        addToast('Tidak dapat menukar jadwal dengan diri sendiri.', 'error');
        return;
      }
    }

    const swapPartner = allUsers.find(u => u.id === reqSwapUserId);
    const targetTlUser = tlUsersList.find(u => u.role === reqTargetTlRole) ||
      allUsers.find(u => u.role === reqTargetTlRole);
    const targetTlDisplay = targetTlUser ? `${targetTlUser.name} (${targetTlUser.role})` : reqTargetTlRole;

    const ticketNo = `REQ-${Date.now().toString().slice(-6)}`;

    const newApproval: ApprovalRequest = {
      id: `appr-${Date.now()}`,
      ticketNumber: ticketNo,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      teamId: currentUser.teamId,
      userTeamId: currentUser.teamId,
      type: reqType,
      targetTlRole: reqTargetTlRole,
      targetTlUserId: targetTlUser?.id,
      targetTlUserName: targetTlDisplay,
      startDate: reqStartDate,
      endDate: reqType === 'Cuti' || reqType === 'Izin' || reqType === 'Sakit' ? reqEndDate : reqStartDate,
      reason: reqReason.trim(),
      // Tukar Jadwal specific fields
      swapWithUserId: reqType === 'Tukar Jadwal' ? reqSwapUserId : undefined,
      swapWithUserName: reqType === 'Tukar Jadwal' ? swapPartner?.name : undefined,
      swapDate: reqType === 'Tukar Jadwal' ? reqSwapDate : undefined,
      originalShiftUserA: reqType === 'Tukar Jadwal' ? reqOriginalShiftA : undefined,
      proposedShiftUserA: reqType === 'Tukar Jadwal' ? reqProposedShiftA : undefined,
      // Perubahan Shift specific fields
      currentShift: reqType === 'Perubahan Shift' ? reqOriginalShiftA : undefined,
      requestedShift: reqType === 'Perubahan Shift' ? reqTargetShift : undefined,
      // Perubahan Kategori specific fields
      currentCategory: reqType === 'Perubahan Kategori' ? reqOriginalCategory : undefined,
      requestedCategory: reqType === 'Perubahan Kategori' ? reqTargetCategory : undefined,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageService.saveApproval(newApproval);

    // Add Audit Log
    storageService.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: `Pengajuan ${reqType}`,
      module: 'Sistem Approval',
      notes: `Tiket #${ticketNo} diajukan oleh ${currentUser.name} dengan tujuan ${reqTargetTlRole}`,
    });

    // Notify Target TL specifically
    if (targetTlUser) {
      storageService.addNotification({
        recipientUserId: targetTlUser.id,
        targetRole: targetTlUser.role,
        title: `Pengajuan ${reqType} Baru (#${ticketNo})`,
        message: `${currentUser.name} (${currentUser.role}) mengajukan permohonan ${reqType} ditujukan untuk Anda (${reqTargetTlRole}).`,
        type: 'APPROVAL',
        linkRoute: 'approvals',
      });
    }

    // Also Notify Koordinator
    storageService.addNotification({
      targetRole: 'KOORDINATOR',
      title: `Pengajuan ${reqType} Baru (#${ticketNo})`,
      message: `${currentUser.name} (${currentUser.role}) mengajukan permohonan ${reqType} dengan tujuan ${reqTargetTlRole}.`,
      type: 'APPROVAL',
      linkRoute: 'approvals',
    });

    addToast(`Permohonan #${ticketNo} berhasil diajukan!`, 'success');
    setIsCreateModalOpen(false);
    setReqReason('');
    reloadData();
  };

  // Open Action Modal
  const handleOpenAction = (approval: ApprovalRequest, type: 'APPROVE' | 'REJECT') => {
    setSelectedApproval(approval);
    setActionType(type);
    setAdminNotes('');
    setIsActionModalOpen(true);
  };

  // Execute Approve or Reject
  const handleExecuteAction = () => {
    if (!selectedApproval || !currentUser) return;

    const newStatus: ApprovalStatus = actionType === 'APPROVE' ? 'Approved' : 'Rejected';

    const updatedApproval: ApprovalRequest = {
      ...selectedApproval,
      status: newStatus,
      approvedBy: `${currentUser.name} (${currentUser.role})`,
      approvedAt: new Date().toISOString(),
      rejectionReason: actionType === 'REJECT' ? adminNotes : undefined,
      updatedAt: new Date().toISOString(),
    };

    storageService.saveApproval(updatedApproval);

    // Automatic Schedule & Data Updates when Approved!
    if (actionType === 'APPROVE') {
      if (selectedApproval.type === 'Tukar Jadwal' && selectedApproval.swapWithUserId) {
        // Swap active schedules between both users
        const dateA = selectedApproval.startDate;
        const dateB = selectedApproval.swapDate || dateA;

        const schedA = schedules.find(s => s.userId === selectedApproval.userId && s.date === dateA);
        const schedB = schedules.find(s => s.userId === selectedApproval.swapWithUserId && s.date === dateB);

        const shiftA = selectedApproval.originalShiftUserA || (schedA ? schedA.shiftCode : 'P1');
        const shiftB = selectedApproval.proposedShiftUserA || (schedB ? schedB.shiftCode : 'P2');

        // Apply swap in active schedule
        storageService.updateScheduleCell(
          selectedApproval.userId,
          dateA,
          shiftB,
          'PETUGAS',
          currentUser.id
        );
        storageService.updateScheduleCell(
          selectedApproval.swapWithUserId,
          dateB,
          shiftA,
          'PETUGAS',
          currentUser.id
        );

        // Update Senada assignments shift code if exists
        const senadaList = storageService.getSenadaAssignments();
        const senA = senadaList.find(s => s.userId === selectedApproval.userId && s.date === dateA);
        if (senA) senA.shiftCode = shiftB;
        const senB = senadaList.find(s => s.userId === selectedApproval.swapWithUserId && s.date === dateB);
        if (senB) senB.shiftCode = shiftA;
        storageService.saveSenadaAssignments(senadaList);

        // Audit Log for the swap
        storageService.addAuditLog({
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'Eksekusi Tukar Shift Otomatis',
          module: 'Sistem Approval & Jadwal',
          notes: `Tukar shift berhasil: ${selectedApproval.userName} (${shiftA} -> ${shiftB}) tgl ${dateA} bertukar dengan ${selectedApproval.swapWithUserName} (${shiftB} -> ${shiftA}) tgl ${dateB}`,
        });
      } else if (selectedApproval.type === 'Perubahan Shift') {
        const date = selectedApproval.startDate;
        const newShift = selectedApproval.requestedShift || 'P1';
        const oldShift = selectedApproval.currentShift || selectedApproval.originalShiftUserA || 'P1';

        storageService.updateScheduleCell(
          selectedApproval.userId,
          date,
          newShift,
          'PETUGAS',
          currentUser.id
        );

        const senadaList = storageService.getSenadaAssignments();
        const sen = senadaList.find(s => s.userId === selectedApproval.userId && s.date === date);
        if (sen) {
          sen.shiftCode = newShift;
          storageService.saveSenadaAssignments(senadaList);
        }

        storageService.addAuditLog({
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'Eksekusi Perubahan Shift Otomatis',
          module: 'Sistem Approval & Jadwal',
          notes: `Perubahan shift ${selectedApproval.userName} tgl ${date} dari ${oldShift} menjadi ${newShift}`,
        });
      } else if (selectedApproval.type === 'Perubahan Kategori') {
        const date = selectedApproval.startDate;
        const newCat = (selectedApproval.requestedCategory || 'PM') as SenadaCategoryCode;
        const oldCat = selectedApproval.currentCategory || 'PM';

        const senadaList = storageService.getSenadaAssignments();
        const idx = senadaList.findIndex(s => s.userId === selectedApproval.userId && s.date === date);
        if (idx >= 0) {
          senadaList[idx].category = newCat;
          senadaList[idx].updatedAt = new Date().toISOString();
        } else {
          const userObj = storageService.getUserById(selectedApproval.userId);
          const userSched = schedules.find(s => s.userId === selectedApproval.userId && s.date === date);
          senadaList.push({
            id: `sen-${selectedApproval.userId}-${date}`,
            userId: selectedApproval.userId,
            npp: userObj?.npp || '',
            userName: selectedApproval.userName,
            teamId: selectedApproval.teamId,
            date: date,
            shiftCode: userSched?.shiftCode || 'P1',
            category: newCat,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        storageService.saveSenadaAssignments(senadaList);

        storageService.addAuditLog({
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'Eksekusi Perubahan Kategori Senada',
          module: 'Sistem Approval & Senada',
          notes: `Perubahan kategori Senada ${selectedApproval.userName} tgl ${date} dari ${oldCat} menjadi ${newCat}`,
        });
      } else {
        // Cuti, Izin, Sakit
        let shiftCode = 'C';
        if (selectedApproval.type === 'Izin') shiftCode = 'I';
        if (selectedApproval.type === 'Sakit') shiftCode = 'S';

        // Update schedule for range
        const start = new Date(selectedApproval.startDate);
        const end = new Date(selectedApproval.endDate);

        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const d = String(dt.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;

          storageService.updateScheduleCell(
            selectedApproval.userId,
            dateStr,
            shiftCode,
            'PETUGAS',
            currentUser.id
          );
        }

        storageService.addAuditLog({
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: `Set Jadwal ${selectedApproval.type} Otomatis`,
          module: 'Sistem Approval & Jadwal',
          notes: `Jadwal ${selectedApproval.userName} disesuaikan menjadi '${shiftCode}' tgl ${selectedApproval.startDate} s/d ${selectedApproval.endDate}`,
        });
      }
    }

    // Send Notification to requester
    storageService.addNotification({
      userId: selectedApproval.userId,
      title: `Pengajuan ${selectedApproval.type} ${newStatus}`,
      message: `Permohonan Anda (#${selectedApproval.ticketNumber}) telah ${newStatus === 'Approved' ? 'disetujui' : 'ditolak'} oleh ${currentUser.name}.${adminNotes ? ` Catatan: ${adminNotes}` : ''}`,
      type: 'APPROVAL',
      linkRoute: 'approvals',
    });

    // If swap partner exists, notify them too
    if (selectedApproval.swapWithUserId) {
      storageService.addNotification({
        userId: selectedApproval.swapWithUserId,
        title: `Tukar Shift ${newStatus}`,
        message: `Permohonan tukar shift dengan ${selectedApproval.userName} telah ${newStatus === 'Approved' ? 'disetujui' : 'ditolak'}.`,
        type: 'APPROVAL',
        linkRoute: 'schedules',
      });
    }

    addToast(`Pengajuan #${selectedApproval.ticketNumber} berhasil diproses (${newStatus}).`, 'success');
    setIsActionModalOpen(false);
    reloadData();
  };

  // Helper options for shifts
  const shiftDefinitions = storageService.getShiftDefinitions();
  const shiftOptions = Object.keys(shiftDefinitions);

  const selectedSwapPartner = allUsers.find(u => u.id === reqSwapUserId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Workflow &amp; Verifikasi Dinas</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Persetujuan &amp; Pengajuan (Approval)
          </h2>
          <p className="text-xs text-slate-500">
            Kelola permohonan cuti, izin, sakit, pertukaran shift kerja, dan perubahan kategori secara real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengajuan Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari pemohon, tiket, alasan, TL..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="ALL">Semua Jenis Pengajuan</option>
              <option value="Cuti">Cuti Kerja</option>
              <option value="Izin">Izin Tidak Masuk</option>
              <option value="Sakit">Izin Sakit</option>
              <option value="Tukar Jadwal">Tukar Shift (Shift Swap)</option>
              <option value="Perubahan Shift">Perubahan Shift</option>
              <option value="Perubahan Kategori">Perubahan Kategori</option>
            </select>
          </div>

          <div>
            <select
              value={filterTargetTl}
              onChange={e => setFilterTargetTl(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="ALL">Semua Tujuan TL (TL 1 - TL 6)</option>
              {TL_ROLES.map(role => (
                <option key={role} value={role}>
                  Tujuan {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="Pending">Pending (Menunggu Verifikasi)</option>
              <option value="Approved">Approved (Disetujui)</option>
              <option value="Rejected">Rejected (Ditolak)</option>
            </select>
          </div>
        </div>

        {/* TL-specific toggle between 'My TL' and 'All' */}
        {isTL && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Filter Pengajuan Team Leader:</span>
              <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTlScopeFilter('MY_TL')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                    tlScopeFilter === 'MY_TL'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tertuju Khusus ke {currentUser?.role}
                </button>
                <button
                  type="button"
                  onClick={() => setTlScopeFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                    tlScopeFilter === 'ALL'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Pengajuan
                </button>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">
              {tlScopeFilter === 'MY_TL'
                ? `Menampilkan permohonan yang dialamatkan untuk verifikasi ${currentUser?.role}`
                : 'Menampilkan seluruh permohonan lintas unit'}
            </span>
          </div>
        )}
      </div>

      {/* Table of Approvals */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">No. Tiket</th>
                <th className="py-3 px-4">Pemohon</th>
                <th className="py-3 px-4">Tujuan TL</th>
                <th className="py-3 px-4">Jenis Permohonan</th>
                <th className="py-3 px-4">Detail Pengajuan &amp; Jadwal</th>
                <th className="py-3 px-4">Alasan &amp; Keterangan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi / Verifikator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredApprovals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada data permohonan yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                filteredApprovals.map(item => {
                  let statusBadge = 'bg-amber-100 text-amber-800 border border-amber-300';
                  if (item.status === 'Approved') statusBadge = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
                  if (item.status === 'Rejected') statusBadge = 'bg-rose-100 text-rose-800 border border-rose-300';

                  let typeBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (item.type === 'Tukar Jadwal') typeBadgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  if (item.type === 'Perubahan Shift') typeBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (item.type === 'Perubahan Kategori') typeBadgeClass = 'bg-teal-50 text-teal-700 border-teal-200';
                  if (item.type === 'Cuti') typeBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (item.type === 'Sakit') typeBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  if (item.type === 'Izin') typeBadgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        #{item.ticketNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{item.userName}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.userRole} &bull; {item.userTeamId}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {item.targetTlRole ? (
                          <div className="space-y-0.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getRoleBadgeClass(item.targetTlRole)}`}>
                              {item.targetTlRole}
                            </span>
                            {item.targetTlUserName && (
                              <div className="text-[11px] text-slate-600 font-medium truncate max-w-[130px]" title={item.targetTlUserName}>
                                {item.targetTlUserName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Semua TL</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${typeBadgeClass}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.type === 'Tukar Jadwal' ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 font-bold text-slate-800">
                              <ArrowLeftRight className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                              <span>Bertukar dengan: {item.swapWithUserName || 'Rekan'}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 flex items-center gap-2">
                              <span>Pemohon: <strong>{item.originalShiftUserA || '-'}</strong> ({item.startDate})</span>
                              <span>&harr;</span>
                              <span>Rekan: <strong>{item.proposedShiftUserA || '-'}</strong> ({item.swapDate || item.startDate})</span>
                            </div>
                          </div>
                        ) : item.type === 'Perubahan Shift' ? (
                          <div className="space-y-0.5">
                            <div className="text-slate-800 font-semibold flex items-center gap-1.5">
                              <RefreshCw className="w-3 h-3 text-blue-600" />
                              <span>Shift: <span className="line-through text-slate-400">{item.currentShift || item.originalShiftUserA || '-'}</span> &rarr; <span className="text-blue-700 font-bold">{item.requestedShift || item.proposedShiftUserA}</span></span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Tanggal Dinas: {item.startDate}
                            </div>
                          </div>
                        ) : item.type === 'Perubahan Kategori' ? (
                          <div className="space-y-0.5">
                            <div className="text-slate-800 font-semibold flex items-center gap-1.5">
                              <Layers className="w-3 h-3 text-teal-600" />
                              <span>Kategori: <span className="line-through text-slate-400">{item.currentCategory || '-'}</span> &rarr; <span className="text-teal-700 font-bold">{item.requestedCategory}</span></span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Tanggal Dinas: {item.startDate}
                            </div>
                          </div>
                        ) : (
                          <div className="font-medium">
                            {item.startDate === item.endDate
                              ? item.startDate
                              : `${item.startDate} s/d ${item.endDate}`}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="truncate font-medium" title={item.reason}>{item.reason}</div>
                        {item.rejectionReason && (
                          <div className="text-[10px] text-rose-600 mt-0.5">
                            Alasan ditolak: {item.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isAdmin && item.status === 'Pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAction(item, 'APPROVE')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition"
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAction(item, 'REJECT')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500">
                            {item.approvedBy ? (
                              <span>Oleh: <strong>{item.approvedBy}</strong></span>
                            ) : (
                              <span>Menunggu Verifikasi</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Formulir Pengajuan Baru */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Formulir Pengajuan Permohonan Dinas"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Permohonan *</label>
            <select
              value={reqType}
              onChange={e => setReqType(e.target.value as ApprovalType)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold text-slate-800"
            >
              <option value="Cuti">Cuti Kerja</option>
              <option value="Izin">Izin Tidak Masuk</option>
              <option value="Sakit">Izin Sakit</option>
              <option value="Tukar Jadwal">Tukar Shift (Shift Swap)</option>
              <option value="Perubahan Shift">Perubahan Shift</option>
              <option value="Perubahan Kategori">Perubahan Kategori (Senada)</option>
            </select>
          </div>

          {/* Target TL Destination Input */}
          <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-1.5">
            <label className="block font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-indigo-950 font-bold">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tujuan Team Leader (TL) Penerima Pengajuan *</span>
              </span>
              <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                Verifikator TL
              </span>
            </label>
            <select
              value={reqTargetTlRole}
              onChange={e => setReqTargetTlRole(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 text-xs shadow-2xs"
            >
              {TL_ROLES.map(role => {
                const tlUser = tlUsersList.find(u => u.role === role);
                return (
                  <option key={role} value={role}>
                    {role} - {tlUser ? `${tlUser.name} (Tim ${role.replace('TL ', '')})` : `Team Leader ${role}`}
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-500">
              Pengajuan akan langsung ditujukan ke antrean verifikasi <strong>{reqTargetTlRole}</strong>.
            </p>
          </div>

          {/* Form Content: Tukar Shift (Tukar Jadwal) */}
          {reqType === 'Tukar Jadwal' && (
            <div className="space-y-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                  <span>Detail Pertukaran Shift</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Pemohon: <strong className="text-slate-700">{currentUser?.name}</strong>
                </span>
              </div>

              {/* Section 1: Pemohon (Saya) */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider text-indigo-600">
                  1. Jadwal Petugas Pemohon (Saya)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanggal Dinas Saya *
                    </label>
                    <input
                      type="date"
                      value={reqStartDate}
                      onChange={e => setReqStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Shift Awal Saya *
                    </label>
                    <select
                      value={reqOriginalShiftA}
                      onChange={e => setReqOriginalShiftA(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      {shiftOptions.map(code => (
                        <option key={code} value={code}>
                          {code} - {shiftDefinitions[code]?.name || code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Rekan Petugas */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider text-indigo-600">
                  2. Petugas Rekan &amp; Shift yang Ditukar
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilih Nama Petugas Rekan *
                  </label>
                  <select
                    value={reqSwapUserId}
                    onChange={e => {
                      const uid = e.target.value;
                      setReqSwapUserId(uid);
                      const pSched = schedules.find(s => s.userId === uid && s.date === reqSwapDate);
                      if (pSched) setReqProposedShiftA(pSched.shiftCode);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="">-- Pilih Petugas Rekan yang Diajak Bertukar --</option>
                    {allUsers
                      .filter(u => u.id !== currentUser?.id && u.status === 'Aktif')
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.npp} &bull; {u.role} &bull; {u.teamId})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanggal Dinas Rekan *
                    </label>
                    <input
                      type="date"
                      value={reqSwapDate}
                      onChange={e => {
                        const d = e.target.value;
                        setReqSwapDate(d);
                        const pSched = schedules.find(s => s.userId === reqSwapUserId && s.date === d);
                        if (pSched) setReqProposedShiftA(pSched.shiftCode);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Shift yang Akan Ditukar (Shift Rekan) *
                    </label>
                    <select
                      value={reqProposedShiftA}
                      onChange={e => setReqProposedShiftA(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      {shiftOptions.map(code => (
                        <option key={code} value={code}>
                          {code} - {shiftDefinitions[code]?.name || code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Visual Preview Box */}
              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-500 block">Pemohon</span>
                  <span className="font-bold text-slate-800">{currentUser?.name}</span>
                  <div className="text-[11px] text-slate-600">
                    Tgl: <strong>{reqStartDate}</strong> &bull; Shift Awal: <strong className="text-indigo-700">{reqOriginalShiftA}</strong>
                  </div>
                </div>

                <div className="flex flex-col items-center px-3">
                  <ArrowLeftRight className="w-4 h-4 text-indigo-600 mb-0.5" />
                  <span className="text-[9px] font-extrabold text-indigo-600 uppercase">Tukar Shift</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-indigo-500 block">Rekan Petugas</span>
                  <span className="font-bold text-slate-800">{selectedSwapPartner?.name || 'Belum dipilih'}</span>
                  <div className="text-[11px] text-slate-600">
                    Tgl: <strong>{reqSwapDate}</strong> &bull; Shift Ditukar: <strong className="text-indigo-700">{reqProposedShiftA}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Content: Perubahan Shift */}
          {reqType === 'Perubahan Shift' && (
            <div className="space-y-3.5 p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="font-bold text-blue-900 flex items-center gap-1.5 border-b border-blue-100 pb-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span>Permohonan Perubahan Shift Kerja</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Dinas *</label>
                <input
                  type="date"
                  value={reqStartDate}
                  onChange={e => setReqStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shift Awal (Saat Ini) *</label>
                  <select
                    value={reqOriginalShiftA}
                    onChange={e => setReqOriginalShiftA(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    {shiftOptions.map(code => (
                      <option key={code} value={code}>
                        {code} - {shiftDefinitions[code]?.name || code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shift Baru yang Diminta *</label>
                  <select
                    value={reqTargetShift}
                    onChange={e => setReqTargetShift(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-indigo-700"
                  >
                    {shiftOptions.map(code => (
                      <option key={code} value={code}>
                        {code} - {shiftDefinitions[code]?.name || code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-blue-100 text-[11px] text-blue-800 flex items-center justify-between">
                <span>Ringkasan Usulan:</span>
                <span className="font-bold">
                  {reqStartDate}: Shift {reqOriginalShiftA} &rarr; Shift {reqTargetShift}
                </span>
              </div>
            </div>
          )}

          {/* Form Content: Perubahan Kategori */}
          {reqType === 'Perubahan Kategori' && (
            <div className="space-y-3.5 p-3.5 bg-teal-50/50 rounded-xl border border-teal-100">
              <div className="font-bold text-teal-900 flex items-center gap-1.5 border-b border-teal-100 pb-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Permohonan Perubahan Kategori Senada</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Dinas *</label>
                <input
                  type="date"
                  value={reqStartDate}
                  onChange={e => setReqStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Awal (Saat Ini) *</label>
                  <select
                    value={reqOriginalCategory}
                    onChange={e => setReqOriginalCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    {SENADA_CATEGORIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Baru yang Diminta *</label>
                  <select
                    value={reqTargetCategory}
                    onChange={e => setReqTargetCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-teal-700"
                  >
                    {SENADA_CATEGORIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-teal-100 text-[11px] text-teal-800 flex items-center justify-between">
                <span>Ringkasan Usulan:</span>
                <span className="font-bold">
                  {reqStartDate}: Kategori {reqOriginalCategory} &rarr; Kategori {reqTargetCategory}
                </span>
              </div>
            </div>
          )}

          {/* Form Content: Cuti, Izin, Sakit */}
          {(reqType === 'Cuti' || reqType === 'Izin' || reqType === 'Sakit') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai *</label>
                <input
                  type="date"
                  value={reqStartDate}
                  onChange={e => setReqStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Selesai *</label>
                <input
                  type="date"
                  value={reqEndDate}
                  onChange={e => setReqEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Alasan &amp; Keterangan Lengkap *</label>
            <textarea
              rows={3}
              value={reqReason}
              onChange={e => setReqReason(e.target.value)}
              placeholder="Jelaskan alasan pengajuan secara jelas dan ringkas..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
            >
              Kirim Pengajuan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Verifikasi Admin (Approve / Reject) */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={actionType === 'APPROVE' ? 'Persetujuan Pengajuan Dinas' : 'Penolakan Pengajuan Dinas'}
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Anda akan{' '}
            <strong className={actionType === 'APPROVE' ? 'text-emerald-600' : 'text-rose-600'}>
              {actionType === 'APPROVE' ? 'MENYETUJUI' : 'MENOLAK'}
            </strong>{' '}
            permohonan <strong>{selectedApproval?.type}</strong> (#{selectedApproval?.ticketNumber}) dari{' '}
            <strong className="text-slate-800">{selectedApproval?.userName}</strong>.
          </p>

          {actionType === 'APPROVE' && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] space-y-1">
              <div className="font-bold">Konsekuensi Persetujuan:</div>
              <div>
                Jadwal operasional aktif petugas akan disesuaikan secara otomatis di kalender sistem.
              </div>
              {selectedApproval?.type === 'Tukar Jadwal' && (
                <div className="text-[10px] text-emerald-700">
                  Shift {selectedApproval.userName} ({selectedApproval.originalShiftUserA || 'Shift Awal'}) akan ditukar dengan {selectedApproval.swapWithUserName} ({selectedApproval.proposedShiftUserA || 'Shift Rekan'}).
                </div>
              )}
              {selectedApproval?.type === 'Perubahan Shift' && (
                <div className="text-[10px] text-emerald-700">
                  Shift {selectedApproval.userName} akan diubah menjadi {selectedApproval.requestedShift || selectedApproval.proposedShiftUserA} pada {selectedApproval.startDate}.
                </div>
              )}
              {selectedApproval?.type === 'Perubahan Kategori' && (
                <div className="text-[10px] text-emerald-700">
                  Kategori Senada {selectedApproval.userName} akan diubah menjadi {selectedApproval.requestedCategory} pada {selectedApproval.startDate}.
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan Verifikator {actionType === 'REJECT' ? '*' : '(Opsional)'}
            </label>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder={actionType === 'REJECT' ? 'Tuliskan alasan penolakan...' : 'Catatan opsional verifikator...'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsActionModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteAction}
              className={`px-5 py-2 text-white rounded-xl font-bold shadow-sm transition ${
                actionType === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Konfirmasi {actionType === 'APPROVE' ? 'Persetujuan' : 'Penolakan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ApprovalManagement;
