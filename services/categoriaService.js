import axios from "axios";

const API_URL = "http://54.227.20.33:5000/category";

export async function buscarCategorias(authToken) {
  return axios.get(API_URL, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });
}

export async function criarCategoria(categoria, authToken) {
  return axios.post(API_URL, JSON.stringify(categoria), {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });
}

export async function excluirCategoria(id, authToken) {
  return axios.delete(`${API_URL}/${id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });
}

export async function atualizarCategoria(id, categoria, authToken) {
  return axios.put(`${API_URL}/${id}`, JSON.stringify(categoria), {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });
}