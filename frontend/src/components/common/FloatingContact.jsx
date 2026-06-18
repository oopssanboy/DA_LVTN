import React from 'react';

export default function FloatingContact() {
    return (
        
        <div className="fixed bottom-[150px] right-6 z-[99] flex flex-col gap-5">
            
       
            <a href="https://zalo.me/0964789010" target="_blank" rel="noreferrer" className="relative group flex justify-center items-center">
                <div className="absolute w-16 h-16 bg-[#0068ff] rounded-full animate-ping opacity-30"></div>
                <div className="absolute w-12 h-12 bg-[#0068ff] rounded-full animate-ping opacity-40 delay-75"></div>
                <div className="relative w-14 h-14 rounded-full bg-[#0068ff] flex items-center justify-center text-white font-black text-[15px] shadow-xl shadow-blue-500/30 hover:-translate-y-1 hover:scale-105 transition-all duration-300">
                    Zalo
                </div>
            </a>

      
            <a href="https://m.me/yourpage" target="_blank" rel="noreferrer" className="relative group flex justify-center items-center">
                <div className="absolute w-16 h-16 bg-[#0084ff] rounded-full animate-ping opacity-30 delay-150"></div>
                <div className="absolute w-12 h-12 bg-[#0084ff] rounded-full animate-ping opacity-40 delay-100"></div>
                <div className="relative w-14 h-14 rounded-full bg-[#0084ff] flex items-center justify-center text-white shadow-xl shadow-blue-500/30 hover:-translate-y-1 hover:scale-105 transition-all duration-300">
                    <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.915 1.516 5.508 3.868 7.21V22l3.528-1.942c.833.23 1.708.353 2.604.353 5.523 0 10-4.145 10-9.259S17.523 2 12 2zm1.093 12.39-2.825-3.018-5.506 3.018 6.035-6.422 2.907 3.018 5.422-3.018-6.033 6.422z"/>
                    </svg>
                </div>
            </a>

         
            <a href="tel:0964789010" className="relative group flex justify-center items-center">
                <div className="absolute w-16 h-16 bg-[#28a745] rounded-full animate-ping opacity-30 delay-300"></div>
                <div className="absolute w-12 h-12 bg-[#28a745] rounded-full animate-ping opacity-40 delay-200"></div>
                <div className="relative w-14 h-14 rounded-full bg-[#28a745] flex items-center justify-center text-white shadow-xl shadow-green-500/30 hover:-translate-y-1 hover:scale-105 transition-all duration-300">
                    <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.03 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                    </svg>
                </div>
            </a>
            
        </div>
    );
}