import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { audio } from '../utils/audio';

export const CustomerService: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Count words
  const wordCount = message.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isMessageValid = wordCount >= 347;
  const isFormValid = name.trim() !== '' && email.trim() !== '' && subject.trim() !== '' && isMessageValid;

  const handleSend = async () => {
    if (!isFormValid) return;
    audio.playClick();
    setIsSending(true);
    
    try {
      await addDoc(collection(db, 'customer_service_chats'), {
        name,
        email,
        subject,
        message,
        timestamp: serverTimestamp(),
        recipient: 'mdv4244@gmail.com'
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }, 3000);
    } catch (e) {
      console.error(e);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <motion.button
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white border-[4px] border-black shadow-[4px_4px_0_#000] z-[100] hover:bg-blue-400 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          audio.playClick();
          setIsOpen(true);
        }}
        title="Chat Customer Service"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#f4dcb8] border-[4px] border-black p-6 rounded-3xl w-full max-w-md shadow-[8px_8px_0_rgba(0,0,0,0.4)] flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black text-black tracking-wide uppercase">Support</h2>
                <button
                  onClick={() => {
                    audio.playClick();
                    setIsOpen(false);
                  }}
                  className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-black font-black hover:bg-red-600 active:scale-95 transition-transform shadow-[2px_2px_0_#000]"
                >
                  ✕
                </button>
              </div>

              {isSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border-[3px] border-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-xl font-black text-emerald-600 mb-2 uppercase tracking-wide">Message Sent!</h3>
                  <p className="text-sm font-bold text-gray-700">We will respond to {email} shortly.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  <div>
                    <label className="block text-xs font-black text-black/70 mb-1 uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border-[3px] border-black rounded-xl p-3 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-black/70 mb-1 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border-[3px] border-black rounded-xl p-3 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Your Email"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-black/70 mb-1 uppercase tracking-wider">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full border-[3px] border-black rounded-xl p-3 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Subject of Chat"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-black/70 mb-1 uppercase tracking-wider flex justify-between">
                      <span>Message</span>
                      <span className={wordCount < 347 ? 'text-red-500' : 'text-emerald-600'}>
                        {wordCount}/347 words required
                      </span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full border-[3px] border-black rounded-xl p-3 bg-white font-bold h-48 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Please explain in extremely thorough detail (at least 347 words required)..."
                    />
                  </div>
                </div>
              )}

              {!isSuccess && isFormValid && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleSend}
                  disabled={isSending}
                  className="mt-6 w-full bg-blue-500 border-[4px] border-black text-white py-3.5 rounded-xl font-black text-xl hover:bg-blue-400 active:scale-95 transition-transform shadow-[4px_4px_0_#000] disabled:opacity-50 uppercase tracking-wide"
                >
                  {isSending ? 'SENDING...' : 'SEND MESSAGE'}
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
