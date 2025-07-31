import React from 'react';  
import { useNavigate } from 'react-router-dom';  
import { Users, Star } from 'lucide-react';  
  
const PersonCard = ({ person, onClick }) => {  
  const navigate = useNavigate();  
    
  const handleClick = () => {  
    if (onClick) {  
      onClick(person.person_id);  
    } else {  
      // Default navigation to person details page  
      navigate(`/people/${person.person_id}`);  
    }  
  };  
  
  return (  
    <div   
      className="group relative w-60 h-80 cursor-pointer transition-all duration-500 hover:scale-105 flex-shrink-0"  
      onClick={handleClick}  
    >  
      {/* Main Card */}  
      <div className="relative w-full h-full bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-blue-500/30">  
          
        {/* Gradient Overlay for Hover Effect */}  
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />  
          
        {/* Glow Effect */}  
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10" />  
          
        {/* Photo Section */}  
        <div className="relative h-4/5 overflow-hidden">  
          {person.photo_url ? (  
            <>  
              <img   
                src={person.photo_url}   
                alt={`${person.first_name} ${person.last_name}`}   
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"   
              />  
              {/* Photo Overlay */}  
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />  
            </>  
          ) : (  
            <div className="w-full h-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center relative">  
              {/* Animated Background Pattern */}  
              <div className="absolute inset-0 opacity-10">  
                <div className="absolute top-4 left-4 w-8 h-8 border border-slate-400 rounded-full animate-pulse" />  
                <div className="absolute bottom-8 right-6 w-6 h-6 border border-slate-400 rounded-full animate-pulse delay-300" />  
                <div className="absolute top-1/2 right-8 w-4 h-4 border border-slate-400 rounded-full animate-pulse delay-700" />  
              </div>  
                
              <div className="relative z-10 p-8 text-center">  
                <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-300 border border-slate-600 group-hover:border-blue-400/30">  
                  <Users size={28} className="text-slate-400 group-hover:text-blue-300 transition-colors duration-300" />  
                </div>  
                <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors duration-300">No Photo Available</p>  
              </div>  
            </div>  
          )}  
            
          {/* Floating Action Indicator */}  
          <div className="absolute top-4 right-4 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 border border-white/20">  
            <Star size={14} className="text-white" />  
          </div>  
        </div>  
          
        {/* Name Section */}  
        <div className="relative h-1/5 p-4 flex items-center justify-center bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm">  
          {/* Background Accent */}  
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />  
            
          <div className="relative z-10 text-center w-full">  
            <p className="text-white font-semibold text-base leading-tight group-hover:text-blue-100 transition-colors duration-300 px-2">  
              <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent group-hover:from-blue-200 group-hover:to-white transition-all duration-300">  
                {person.first_name} {person.last_name}  
              </span>  
            </p>  
              
            {/* Subtle underline effect */}  
            <div className="w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mt-2 group-hover:w-12 transition-all duration-500 rounded-full" />  
          </div>  
        </div>  
          
        {/* Shimmer Effect */}  
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none" />  
      </div>  
        
      {/* Enhanced Shadow */}  
      <div className="absolute inset-0 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl -z-20 scale-110" />  
    </div>  
  );  
};  
  
export default PersonCard; 