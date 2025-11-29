import axios from 'axios';

/**
 * Sube una imagen a Cloudinary y devuelve la URL pública.
 * @param {File} file - La imagen seleccionada (desde un input tipo file).
 * @returns {Promise<string>} URL de la imagen subida.
 */
export const uploadReosurseImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "petsimg"); // reemplaza por el tuyo

  try {
    const response = await axios.post(
      "https://api.cloudinary.com/v1_1/djcnay2fx/image/upload", // reemplaza por el tuyo
      formData
    );
    return response.data.secure_url;
    

  } catch (error) {
    console.error("Error al subir la imagen a Cloudinary:", error);
    throw error;
  }
};