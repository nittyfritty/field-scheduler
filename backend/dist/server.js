import app from "./app.js";
import connectDB from "./config/db.js";
import "dotenv/config";
const PORT = process.env.PORT || 3000;
async function main() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Database connection error:", error);
    }
}
main();
//# sourceMappingURL=server.js.map