"use client";
import React, { useState, useEffect } from "react";
import LayoutAdmin from "@/components/LayoutAdmin/LayoutAdmin";
import validationUsers from "./validationUsers";
import Loader from "@/components/Loader/Loader";
import Image from "next/image";
import Modal from "react-modal";
import {
  Pencil,
  XCircle,
  FloppyDisk,
  Prohibit,
} from "@phosphor-icons/react/dist/ssr";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Error al obtener la lista de usuarios");
      }

      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (error) {
      console.error(error.message);
      setError(`No se encontraron coincidencias con ${searchTerm}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const filteredUsers = users.filter((user) => {
    const userName = user.name.toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    const searchWords = searchTermLower.split(" ");
    return searchWords.every((word) => userName.includes(word));
  });
  const sortedUsers = filteredUsers
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const openModal = async (user) => {
    try {
      const response = await fetch(`/api/users/${user._id}`);
      if (!response.ok) {
        throw new Error("Error al obtener los datos del usuario");
      }

      const userData = await response.json();
      const transformedUser = transformUserData(userData);

      setSelectedUser(transformedUser);
      setEditedUser(null);
      setIsEditing(false);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error al abrir el modal:", error);
    }
  };

  const transformUserData = (userData) => {
    if (userData.city) {
      userData.city = userData.city.name;
    }

    if (userData.province) {
      userData.province = userData.province.name;
    }

    return userData;
  };

  const closeModal = () => {
    setSelectedUser(null);
    setEditedUser(null);
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditedUser({ ...selectedUser });
  };

  const handleInputChange = (field, value) => {
    setEditedUser({ ...editedUser, [field]: value });
    setForm({ ...form, [field]: value });
  };

  const handleImageChange = (file) => {
    try {
      if (file) {
        const reader = new FileReader();

        reader.onload = (event) => {
          const imageUrl = event.target.result;
          setEditedUser({ ...editedUser, img: imageUrl });
        };

        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("Error al cargar la imagen:", error);
    }
  };

  const deleteUser = async () => {
    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        closeModal();
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.mensaje);
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      setError("Error al eliminar usuario");
    }
  };

  const saveChanges = async () => {
    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dataSinPass: editedUser }),
      });
      console.log("response cliente", response);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error al actualizar el usuario.");
      }

      setIsEditing(false);
      closeModal();
      fetchUsers();
      setEditedUser(null);
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
      setError(
        "Error al actualizar el usuario. Por favor, inténtalo de nuevo."
      );
    }
  };

  //VALIDATION
  const [formError, setFormError] = useState({});

  const [form, setForm] = useState({
    name: "",
    lastname: "",
    username: "",
    adress: "",
    city: "",
    province: "",
    email: "",
    codeP: "",
    token: "",
  });

  const handleValidation = () => {
    const errors = validationUsers(form);

    setFormError(errors);
  };

  useEffect(() => {
    handleValidation();
  }, [form]);

  const disableButton = () => {
    let aux = true;

    if (Object.keys(formError).length === 0) {
      aux = false;
    }

    return aux;
  };

  useEffect(() => {
    // Este useEffect se ejecutará solo cuando el componente se monte
    // Reinicia el formulario estableciendo los valores iniciales
    setFormError({});
  }, []);

  return (
    <>
      {isLoading && <Loader />}
      <div className="p-4">
        <h1 className="mb-4 text-2xl font-semibold">Lista de Usuarios</h1>

        <input
          type="text"
          placeholder="Buscar por nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 mb-4 border border-gray-300 rounded"
        />

        {error && <div className="mb-4 text-red-500">{error}</div>}

        {!isLoading && sortedUsers.length === 0 && !error && (
          <div className="mb-4">
            <p>No se encontraron coincidencias con {searchTerm}.</p>
          </div>
        )}

        {!isLoading && Array.isArray(sortedUsers) && sortedUsers.length > 0 && (
          <ul className="overflow-y-scroll max-h-[52vh] w-[60vw] max-w-[60vw]">
            {sortedUsers.map((user) => (
              <li
                key={user._id}
                className="p-2 mb-2 transition-all duration-300 ease-in-out rounded cursor-pointer hover:bg-pink-100 hover:text-black"
                onClick={() => openModal(user)}
              >
                <span className="hover:font-bold">{user.name}</span>
              </li>
            ))}
          </ul>
        )}

        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          contentLabel="Editar Usuario"
          style={{
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
            content: {
              width: "500px",
              margin: "auto",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              background: "rgba(255, 255, 255, 0.95)",
              marginTop: "50px",
              border: "2px solid #FFB6C1",
            },
          }}
        >
          {selectedUser && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2>
                  {selectedUser?.name} {selectedUser?.lastname}
                </h2>
                <div className="flex items-center">
                  {isEditing ? (
                    <>
                      <button
                        className="px-2 py-1 mr-2 text-white bg-green-500 rounded"
                        onClick={saveChanges}
                        disabled={disableButton()}
                      >
                        <FloppyDisk size={24} />
                      </button>
                      <button
                        className="px-2 py-1 text-white bg-gray-500 rounded"
                        onClick={() => setIsEditing(false)}
                      >
                        <Prohibit size={24} />
                      </button>
                      <button
                        className="px-2 py-1 ml-2 text-white bg-red-500 rounded"
                        onClick={deleteUser}
                      >
                        Eliminar
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={startEditing}>
                        <Pencil size={24} />
                      </button>
                      <button onClick={closeModal}>
                        <XCircle size={24} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <>
                  <div className="mb-4">
                    <span className="block mb-2 font-bold">Imagen:</span>
                    {editedUser.img && (
                      <Image
                        src={editedUser.img}
                        alt={`${selectedUser.name} ${selectedUser.lastname}`}
                        width={300}
                        height={300}
                        className="rounded-lg"
                      />
                    )}
                    <input
                      type="file"
                      onChange={(e) => handleImageChange(e.target.files[0])}
                      className={`border border-rosybrown rounded p-1 mb-2 ${
                        isEditing ? "bg-rosybrown-light" : ""
                      }`}
                    />
                  </div>

                  <label className="block mb-2 font-bold">Nombre:</label>
                  <input
                    type="text"
                    value={editedUser.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`border border-rosybrown rounded p-1 mb-2 ${
                      isEditing ? "bg-rosybrown-light" : ""
                    }`}
                  />
                  {formError.name ? (
                    <p className="text-red-500">{formError.name}</p>
                  ) : (
                    <p>
                      <br />
                    </p>
                  )}

                  <label className="block mb-2 font-bold">Apellido:</label>
                  <input
                    type="text"
                    value={editedUser.lastname}
                    onChange={(e) =>
                      handleInputChange("lastname", e.target.value)
                    }
                    className={`border border-rosybrown rounded p-1 mb-2 ${
                      isEditing ? "bg-rosybrown-light" : ""
                    }`}
                  />
                  {formError.lastname ? (
                    <p className="text-red-500">{formError.lastname}</p>
                  ) : (
                    <p>
                      <br />
                    </p>
                  )}

                  <label className="block mb-2 font-bold">
                    Nombre de usuario:
                  </label>
                  <input
                    type="text"
                    value={editedUser.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    className={`border border-rosybrown rounded p-1 mb-2 ${
                      isEditing ? "bg-rosybrown-light" : ""
                    }`}
                  />

                  {formError.username ? (
                    <p className="text-red-500">{formError.username}</p>
                  ) : (
                    <p>
                      <br />
                    </p>
                  )}

                  <label className="block mb-2 font-bold">Dirección:</label>
                  <input
                    type="text"
                    value={editedUser.adress}
                    onChange={(e) =>
                      handleInputChange("adress", e.target.value)
                    }
                    className={`border border-rosybrown rounded p-1 mb-2 ${
                      isEditing ? "bg-rosybrown-light" : ""
                    }`}
                  />

                  {formError.adress ? (
                    <p className="text-red-500">{formError.adress}</p>
                  ) : (
                    <p>
                      <br />
                    </p>
                  )}

                  <label className="block mb-2 font-bold">Ciudad:</label>
                  <input
                    type="text"
                    value={editedUser.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className={`border border-rosybrown rounded p-1 mb-2 ${
                      isEditing ? "bg-rosybrown-light" : ""
                    }`}
                  />

                  <label className="block mb-2 font-bold">Provincia:</label>
                  <input
                    type="text"
                    value={editedUser.province}
                    onChange={(e) =>
                      handleInputChange("province", e.target.value)
                    }
                    className={`border border-rosybrown rounded p-1 mb-2 ${
                      isEditing ? "bg-rosybrown-light" : ""
                    }`}
                  />

                  <label className="block mb-2 font-bold">Rol:</label>
                  {isEditing ? (
                    <select
                      value={editedUser.role}
                      onChange={(e) =>
                        handleInputChange("role", e.target.value)
                      }
                      className={`border border-rosybrown rounded p-1 mb-2 ${
                        isEditing ? "bg-rosybrown-light" : ""
                      }`}
                    >
                      <option value="1"> 1</option>
                      <option value="2"> 2</option>
                    </select>
                  ) : (
                    <p>{selectedUser.role === "1" ? "Opción 1" : "Opción 2"}</p>
                  )}

                  <label className="block mb-2 font-bold">Email:</label>
                  <input
                    type="text"
                    value={editedUser.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`border border-rosybrown rounded p-1 mb-2 ${
                      isEditing ? "bg-rosybrown-light" : ""
                    }`}
                  />

                  {formError.email ? (
                    <p className="text-red-500">{formError.email}</p>
                  ) : (
                    <p>
                      <br />
                    </p>
                  )}

                  <label className="block mb-2 font-bold">Código Postal:</label>
                  <input
                    type="text"
                    value={editedUser.codeP}
                    onChange={(e) => handleInputChange("codeP", e.target.value)}
                    className={`border border-rosybrown rounded p-1 mb-2 ${
                      isEditing ? "bg-rosybrown-light" : ""
                    }`}
                  />

                  {formError.codeP ? (
                    <p className="text-red-500">{formError.codeP}</p>
                  ) : (
                    <p>
                      <br />
                    </p>
                  )}

                  <label className="block mb-2 font-bold">Token:</label>
                  <input
                    type="text"
                    value={editedUser.token}
                    onChange={(e) => handleInputChange("token", e.target.value)}
                    className={`border border-rosybrown rounded p-1 mb-2 ${
                      isEditing ? "bg-rosybrown-light" : ""
                    }`}
                  />

                  {/* {formError.token ? 
                (<p className="text-red-500">{formError.token}</p>) : 
                (
                <p>
                <br />
                </p>
                )} */}

                  <label className="block mb-2 font-bold">Activo:</label>
                  {isEditing ? (
                    <select
                      value={editedUser.active ? "Sí" : "No"}
                      onChange={(e) =>
                        handleInputChange("active", e.target.value === "Sí")
                      }
                      className={`border border-rosybrown rounded p-1 mb-2 ${
                        isEditing ? "bg-rosybrown-light" : ""
                      }`}
                    >
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  ) : (
                    <p>{selectedUser.active ? "Sí" : "No"}</p>
                  )}
                </>
              ) : (
                <>
                  <p>
                    <span className="font-bold">Imagen:</span>{" "}
                    {selectedUser.img && (
                      <Image
                        src={selectedUser.img}
                        alt={`${selectedUser.name} ${selectedUser.lastname}`}
                        width={300}
                        height={300}
                        className="rounded-lg"
                      />
                    )}
                  </p>
                  <p>
                    <span className="font-bold">Nombre:</span>{" "}
                    {selectedUser.name}
                  </p>
                  <p>
                    <span className="font-bold">Apellido:</span>{" "}
                    {selectedUser.lastname}
                  </p>
                  <p>
                    <span className="font-bold">Nombre de usuario:</span>{" "}
                    {selectedUser.username}
                  </p>
                  <p>
                    <span className="font-bold">Dirección:</span>{" "}
                    {selectedUser.adress}
                  </p>
                  <p>
                    <span className="font-bold">Ciudad:</span>{" "}
                    {selectedUser.city}
                  </p>
                  <p>
                    <span className="font-bold">Provincia:</span>{" "}
                    {selectedUser.province}
                  </p>
                  <p>
                    <span className="font-bold">Rol:</span> {selectedUser.role}
                  </p>
                  <p>
                    <span className="font-bold">Email:</span>{" "}
                    {selectedUser.email}
                  </p>
                  <p>
                    <span className="font-bold">Código Postal:</span>{" "}
                    {selectedUser.codeP}
                  </p>
                  <p>
                    <span className="font-bold">Token:</span>{" "}
                    {selectedUser.token}
                  </p>
                  <p>
                    <span className="font-bold">Activo:</span>{" "}
                    {selectedUser.active ? "Sí" : "No"}
                  </p>
                </>
              )}
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default UsersPage;
