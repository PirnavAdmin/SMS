import React, { useEffect, useMemo, useState } from "react";
import BankForm from "./BankForm";
import BankTable from "./BankTable";
import "./BankAccount.css";

const emptyForm = {
  bankName: "",
  branchName: "",
  accountHolder: "",
  accountNumber: "",
  instituteName: "",
  ifscCode: "",
  feeType: "",
};

const initialBanks = [
  {
    id: 1,
    bankName: "yes bank",
    branchName: "1234567",
    accountHolder: "rajesh",
    accountNumber: "67890",
    instituteName: "dfghjkl",
    ifscCode: "67890",
    feeType: "Tuition Fee",
  },
];

function BankAccount() {
  const [banks, setBanks] = useState(initialBanks);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState("100");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredBanks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? banks.filter((bank) =>
          [
            bank.bankName,
            bank.branchName,
            bank.accountHolder,
            bank.accountNumber,
            bank.instituteName,
            bank.ifscCode,
            bank.feeType,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
      : banks;
  }, [banks, search]);

  const entriesPerPage = Number(entries);
  const totalPages = Math.max(1, Math.ceil(filteredBanks.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const visibleBanks = filteredBanks.slice(startIndex, startIndex + entriesPerPage);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (editingId) {
      setBanks((current) =>
        current.map((bank) =>
          bank.id === editingId ? { ...formData, id: editingId } : bank
        )
      );
      resetForm();
      return;
    }

    setBanks((current) => [
      ...current,
      {
        ...formData,
        id: Date.now(),
      },
    ]);
    resetForm();
  };

  const handleEdit = (bank) => {
    const { id, ...bankValues } = bank;
    setEditingId(id);
    setFormData(bankValues);
  };

  const handleDelete = (id) => {
    setBanks((current) => current.filter((bank) => bank.id !== id));
    if (editingId === id) {
      resetForm();
    }
  };

  const handleEntriesChange = (value) => {
    setEntries(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  return (
    <div className="bank-account-page">
      <BankForm
        formData={formData}
        isEditing={Boolean(editingId)}
        onChange={handleChange}
        onCancel={resetForm}
        onSubmit={handleSubmit}
      />

      <BankTable
        banks={visibleBanks}
        entries={entries}
        search={search}
        currentPage={currentPage}
        entriesPerPage={entriesPerPage}
        totalEntries={filteredBanks.length}
        totalPages={totalPages}
        onEntriesChange={handleEntriesChange}
        onSearchChange={handleSearchChange}
        onPageChange={setCurrentPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default BankAccount;
