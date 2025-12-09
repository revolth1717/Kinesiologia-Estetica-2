"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    id: string;
    content: string;
    sender: "user" | "bot";
    timestamp: Date;
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            content: "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
            sender: "bot",
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!inputValue.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            content: inputValue,
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            // Ruteo dinámico según el rol
            const webhookUrl = user?.role === "administrador"
                ? "https://kinesiologia.app.n8n.cloud/webhook/prueba" // Bot Admin
                : "https://kinesiologia.app.n8n.cloud/webhook/kine-cliente-web"; // Bot Cliente - NOMBRE ÚNICO

            console.log("🔍 DEBUG CHATBOT:", {
                rol: user?.role,
                url_elegida: webhookUrl
            });

            const response = await fetch(
                webhookUrl,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: newMessage.content,
                        userId: user?.id || "anonymous",
                        userEmail: user?.email || "anonymous",
                        userName: user?.nombre || "Guest",
                        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        role: user?.role || "cliente", // Enviar rol a n8n
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Error connecting to chatbot service");
            }

            const data = await response.json();

            // Handle different response formats from n8n
            let botResponseText = "Lo siento, no pude procesar tu solicitud.";

            if (typeof data === 'string') {
                botResponseText = data;
            } else if (data.output) {
                botResponseText = data.output;
            } else if (data.message) {
                botResponseText = data.message;
            } else if (data.text) {
                botResponseText = data.text;
            } else if (Array.isArray(data) && data.length > 0 && data[0].output) {
                botResponseText = data[0].output;
            }

            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                content: botResponseText,
                sender: "bot",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botResponse]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorResponse: Message = {
                id: (Date.now() + 1).toString(),
                content: "Lo siento, hubo un error al conectar con el servidor. Por favor intenta más tarde.",
                sender: "bot",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };
    // Número de WhatsApp de prueba (Meta)
    const WHATSAPP_NUMBER = "15551828558";
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}`;

    const renderMessageWithLinks = (text: string) => {
        // Expresión regular para detectar URLs (excluyendo paréntesis de cierre)
        const urlRegex = /(https?:\/\/[^\s)]+)/g;

        // Dividir el texto por la URL
        const parts = text.split(urlRegex);

        return parts.map((part, index) => {
            // Si la parte coincide con la regex, renderizarla como link
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-200 underline hover:text-white break-all"
                    >
                        {part}
                    </a>
                );
            }
            // Si no, renderizar como texto normal
            return part;
        });
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${isOpen
                    ? "bg-red-500 text-white rotate-90"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    }`}
                aria-label="Toggle Chatbot"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-6 z-50 w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-full">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Asistente Virtual</h3>
                                <p className="text-xs text-blue-100 flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${user ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}></span>
                                    {user ? "En línea" : "Desconectado"}
                                </p>
                            </div>
                        </div>

                        {!user ? (
                            // Login Required State
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 bg-gray-50 dark:bg-gray-900/50">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                                    <User size={48} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        ¡Hola! 👋
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        Para poder responder tus preguntas y ayudarte mejor, necesitas iniciar sesión o crear una cuenta.
                                    </p>
                                </div>
                                <div className="flex flex-col w-full gap-3">
                                    <a
                                        href="/login"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                                    >
                                        Iniciar Sesión
                                    </a>
                                    <a
                                        href="/registro"
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-2.5 rounded-lg transition-colors"
                                    >
                                        Crear Cuenta
                                    </a>
                                </div>
                            </div>
                        ) : (
                            // Authenticated Chat Interface
                            <>
                                {/* WhatsApp Link for Clients */}
                                {user?.role !== "administrador" && (
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 border-b border-green-100 dark:border-green-800 flex justify-between items-center">
                                        <span className="text-xs text-green-800 dark:text-green-300 font-medium">
                                            ¿Prefieres hablar por WhatsApp?
                                        </span>
                                        <a
                                            href={whatsappLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-full transition-colors font-medium flex items-center gap-1"
                                        >
                                            <MessageCircle size={12} />
                                            Chatear
                                        </a>
                                    </div>
                                )}

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                                                }`}
                                        >
                                            <div
                                                className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === "user"
                                                    ? "bg-blue-600 text-white rounded-br-none"
                                                    : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-600"
                                                    }`}
                                            >
                                                <p className="whitespace-pre-wrap">{renderMessageWithLinks(msg.content)}</p>
                                                <span
                                                    className={`text-[10px] mt-1 block opacity-70 ${msg.sender === "user" ? "text-blue-100" : "text-gray-400"
                                                        }`}
                                                >
                                                    {msg.timestamp.toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-600 flex items-center gap-2">
                                                <Loader2 size={16} className="animate-spin text-blue-600" />
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Escribiendo...
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <form
                                    onSubmit={handleSendMessage}
                                    className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700"
                                >
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Escribe tu mensaje..."
                                            className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border-transparent"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputValue.trim() || isLoading}
                                            className="p-2 rounded-full bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}