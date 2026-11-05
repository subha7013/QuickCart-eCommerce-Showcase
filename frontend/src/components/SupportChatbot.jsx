import React, { useState, useEffect, useRef } from 'react';
import {
    Bot, Send, User, AlertCircle, CheckCircle2, LifeBuoy,
    ExternalLink, ArrowRight, ShieldAlert, Sparkles, MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function SupportChatbot() {
    const {
        currentUser,
        orders,
        freeCash,
        escalateIncident,
        userIncidents,
        setCurrentView,
        setActiveTrackingOrder,
        showToast
    } = useApp();

    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'bot',
            text: `Hello ${currentUser?.email ? currentUser.email.split('@')[0] : 'there'}! 👋 I'm Quickie, your 24x7 QuickCart Smart Support Assistant. How can I help you today?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [escalatedTicketId, setEscalatedTicketId] = useState(null);
    const messagesEndRef = useRef(null);

    const latestOrder = orders.length > 0 ? orders[0] : null;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Intelligent Indian eCommerce AI response generator
    function generateSmartBotReply(queryText, orderRef) {
        const query = queryText.toLowerCase();

        // 1. Order Tracking Query
        if (query.includes('where') || query.includes('track') || query.includes('status') || query.includes('delivery time') || query.includes('when')) {
            const targetOrder = orderRef || latestOrder;
            if (!targetOrder) {
                return {
                    text: "You don't have any recent orders yet! You can start shopping from our fresh fruits, vegetables & electronics collection.",
                    canEscalate: false
                };
            }
            const itemsSummary = targetOrder.items?.map(i => i.name).slice(0, 2).join(', ') || 'items';
            const tracking = targetOrder.trackingId || targetOrder._id?.slice(-8) || 'QC-TRK-LIVE';
            const statusLabel = (targetOrder.status || 'placed').toUpperCase();
            return {
                text: `📦 Your order (${tracking}) with "${itemsSummary}" is currently [${statusLabel}]. Estimated arrival: ${targetOrder.estimatedDelivery || 'in 12-15 minutes'}.`,
                action: { type: 'track', order: targetOrder, label: 'Open Live Visual Tracking' },
                canEscalate: true
            };
        }

        // 2. Cancellation & Refund
        if (query.includes('cancel') || query.includes('refund') || query.includes('return')) {
            const targetOrder = orderRef || latestOrder;
            if (targetOrder && targetOrder.status === 'placed') {
                return {
                    text: `Your order #${targetOrder.trackingId || targetOrder._id?.slice(-6)} is currently 'Placed' and eligible for instant 1-click cancellation from your My Orders tab. Inventory and any Free Cash used will be immediately refunded to your account.`,
                    action: { type: 'orders', label: 'Go to My Orders' },
                    canEscalate: true
                };
            }
            return {
                text: "Orders in 'Placed' status can be cancelled instantly with full automatic refund. For orders already packed, shipped, or delivered, our customer escalation team can initiate a return or replacement ticket.",
                canEscalate: true
            };
        }

        // 3. Free Cash / Wallet
        if (query.includes('free cash') || query.includes('cash') || query.includes('wallet') || query.includes('balance') || query.includes('gift')) {
            return {
                text: `💰 You currently have ₹${freeCash} Free Cash available in your QuickCart wallet! You can toggle the 'Apply Free Cash' checkbox on the Cart page to deduct it from your final total.`,
                canEscalate: false
            };
        }

        // 4. Delivery Speed / Area
        if (query.includes('10 min') || query.includes('speed') || query.includes('fast') || query.includes('express')) {
            return {
                text: "⚡ QuickCart delivers within 10 to 15 minutes by routing your order directly to our nearest neighborhood hyper-local darkstore hub with live delivery partner GPS simulation.",
                canEscalate: false
            };
        }

        // 5. Defective / Damaged / Wrong item
        if (query.includes('damaged') || query.includes('wrong') || query.includes('broken') || query.includes('expired') || query.includes('missing')) {
            return {
                text: "We deeply apologize for this! QuickCart has a strict 100% Quality Assurance promise. I can immediately escalate this as an Incident Ticket for our Senior Admin Team to issue an instant replacement or refund.",
                canEscalate: true,
                autoEscalatePrompt: true
            };
        }

        // 6. Request for Human Agent / Escalation
        if (query.includes('human') || query.includes('agent') || query.includes('escalat') || query.includes('complaint') || query.includes('speak') || query.includes('admin') || query.includes('help me')) {
            return {
                text: "Understood! I will connect you directly with our Senior Admin Support Team by filing an official Incident Ticket.",
                canEscalate: true,
                autoEscalatePrompt: true
            };
        }

        // Default Helpful Response
        return {
            text: "I can help you check real-time order tracking, process cancellations, explain Free Cash wallet savings, or instantly escalate any issue directly to our Admin team.",
            canEscalate: true
        };
    }

    async function handleSendMessage(e) {
        if (e && e.preventDefault) e.preventDefault();
        const text = inputText.trim();
        if (!text) return;

        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        const targetOrder = orders.find(o => o._id === selectedOrderId || o.trackingId === selectedOrderId) || latestOrder;

        setTimeout(async () => {
            const reply = generateSmartBotReply(text, targetOrder);

            const botMsg = {
                id: Date.now() + 1,
                sender: 'bot',
                text: reply.text,
                action: reply.action,
                canEscalate: reply.canEscalate,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);

            // If user explicitly asked for human agent or reported damaged item, auto prompt escalation
            if (reply.autoEscalatePrompt) {
                await triggerEscalation(`Customer reported: "${text.slice(0, 60)}"`);
            }
        }, 600);
    }

    async function triggerEscalation(customSubject) {
        setIsTyping(true);
        const subject = customSubject || 'Customer requested Senior Agent assistance';
        const targetOrder = orders.find(o => o._id === selectedOrderId || o.trackingId === selectedOrderId) || latestOrder;

        const historyPayload = messages.map(m => ({
            sender: m.sender,
            text: m.text,
            time: new Date()
        }));

        const res = await escalateIncident({
            orderId: targetOrder?.trackingId || targetOrder?._id || '',
            subject,
            category: 'Order Tracking',
            chatHistory: historyPayload,
            priority: 'urgent'
        });

        setIsTyping(false);

        if (res.ok) {
            setEscalatedTicketId(res.ticketId);
            const escalationMsg = {
                id: Date.now() + 2,
                sender: 'bot',
                text: `🚨 Official Incident Created: #${res.ticketId}\n\nYour issue has been assigned to our Senior Admin Support Team. An administrator has been notified to investigate your order and respond with priority resolution.`,
                isEscalationNotice: true,
                ticketId: res.ticketId,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, escalationMsg]);
            showToast(`Incident #${res.ticketId} escalated to Admin 🚨`);
        } else {
            showToast('Failed to create ticket: ' + (res.msg || 'Error'));
        }
    }

    return (
        <div className="qc-chatbot-card">
            {/* Chatbot Header */}
            <div className="qc-chatbot-header">
                <div className="qc-bot-avatar-box">
                    <Bot size={22} className="qc-bot-icon" />
                    <span className="qc-online-dot"></span>
                </div>
                <div className="qc-bot-header-info">
                    <div className="qc-bot-name-row">
                        <h4>Quickie AI Assistant</h4>
                        <span className="qc-bot-verified-badge">
                            <Sparkles size={11} /> Real-Time Support
                        </span>
                    </div>
                    <p className="qc-bot-sub">Answers instantly like a human agent • 24x7 Active</p>
                </div>

                {escalatedTicketId && (
                    <div className="qc-active-ticket-chip">
                        <ShieldAlert size={13} />
                        <span>Ticket #{escalatedTicketId}</span>
                    </div>
                )}
            </div>

            {/* Order Selector (if user has orders) */}
            {orders.length > 0 && (
                <div className="qc-chat-order-selector-bar">
                    <span className="qc-selector-label">Inquiring about order:</span>
                    <select
                        value={selectedOrderId}
                        onChange={(e) => setSelectedOrderId(e.target.value)}
                        className="qc-chat-order-select"
                    >
                        <option value="">Latest Order ({latestOrder?.trackingId || latestOrder?._id?.slice(-6)})</option>
                        {orders.map((o) => (
                            <option key={o._id} value={o._id}>
                                {o.trackingId || o._id.slice(-6)} — ₹{o.total} ({o.status})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Messages Scroll Area */}
            <div className="qc-chat-messages-area">
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`qc-chat-bubble-row ${m.sender === 'user' ? 'user' : 'bot'}`}
                    >
                        {m.sender === 'bot' && (
                            <div className="qc-bot-bubble-avatar">
                                <Bot size={15} />
                            </div>
                        )}

                        <div className={`qc-chat-bubble ${m.sender === 'user' ? 'user' : 'bot'} ${m.isEscalationNotice ? 'escalation-notice' : ''}`}>
                            <p className="qc-bubble-text">{m.text}</p>

                            {/* Action Button inside bubble */}
                            {m.action && (
                                <div className="qc-bubble-action-box">
                                    {m.action.type === 'track' && (
                                        <button
                                            className="qc-bubble-action-btn"
                                            onClick={() => {
                                                setActiveTrackingOrder(m.action.order);
                                                setCurrentView('tracking');
                                            }}
                                        >
                                            <span>{m.action.label}</span>
                                            <ExternalLink size={13} />
                                        </button>
                                    )}
                                </div>
                            )}

                            <span className="qc-bubble-timestamp">{m.time}</span>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="qc-chat-bubble-row bot">
                        <div className="qc-bot-bubble-avatar">
                            <Bot size={15} />
                        </div>
                        <div className="qc-typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips Bar */}
            <div className="qc-chat-quick-chips">
                <button
                    className="qc-quick-chip"
                    onClick={() => {
                        setInputText('Where is my order?');
                    }}
                >
                    📦 Where is my order?
                </button>
                <button
                    className="qc-quick-chip"
                    onClick={() => {
                        setInputText('Can I cancel or get a refund?');
                    }}
                >
                    ❌ Cancel / Refund Query
                </button>
                <button
                    className="qc-quick-chip"
                    onClick={() => {
                        setInputText('How do I use my Free Cash balance?');
                    }}
                >
                    💰 Free Cash Wallet Info
                </button>
                <button
                    className="qc-quick-chip escalate"
                    onClick={() => triggerEscalation('User pressed Escalate to Human Agent chip')}
                >
                    👨‍💼 Talk to Senior Agent (Escalate)
                </button>
            </div>

            {/* Chat Input Bar */}
            <form className="qc-chat-input-bar" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    className="qc-chat-input"
                    placeholder="Type your question (e.g. tracking, cancellation, damages)..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" className="qc-chat-send-btn" disabled={!inputText.trim()}>
                    <Send size={16} />
                </button>
            </form>

            {/* Escalated Tickets Summary Drawer */}
            {userIncidents.length > 0 && (
                <div className="qc-escalated-tickets-footer">
                    <div className="qc-tickets-footer-header">
                        <ShieldAlert size={14} />
                        <span>Your Escalated Incidents ({userIncidents.length})</span>
                    </div>
                    <div className="qc-tickets-list-mini">
                        {userIncidents.slice(0, 3).map((inc) => (
                            <div key={inc.ticketId || inc._id} className="qc-ticket-item-mini">
                                <span className="qc-ticket-id-tag">#{inc.ticketId}</span>
                                <span className="qc-ticket-subj">{inc.subject || 'Support Ticket'}</span>
                                <span className={`qc-ticket-status-pill ${inc.status || 'open'}`}>
                                    {inc.status || 'Open'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
