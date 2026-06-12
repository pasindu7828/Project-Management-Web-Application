import bcrypt from "bcryptjs"

//password hashin helper file
export const hashPassword = async (password) => {
    try {

        const saltRounds = 10;
        const hashedPassword = bcrypt.hash(password, saltRounds);
        return hashedPassword;

    } catch (error) {
        console.log(error)
    }
};

export const comparePassword = async (password, hashPassword) => {
    return bcrypt.compare(password,hashPassword);
};