    import { useEffect } from "react";

    type Props = {
    message: string;
    type?: "error" | "success";
    onClose: () => void;
    };

    export default function Notification({ message, type = "error", onClose }: Props) {

    useEffect(() => {
        const timer = setTimeout(() => {
        onClose();
        }, 3500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={overlay}>
        <div
            style={{
            ...box,
            backgroundColor: type === "error" ? "#dc3545" : "#28a745"
            }}
        >
            {message}
        </div>
        </div>
    );
    }

    const overlay = {
    position: "fixed" as const,
    top: 20,
    right: 20,
    zIndex: 9999
    };

    const box = {
    padding: "15px 25px",
    color: "white",
    borderRadius: 10,
    fontWeight: 500,
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    fontSize: 14
    };