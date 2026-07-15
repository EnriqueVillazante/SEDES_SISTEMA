import { Check } from 'lucide-react';

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepProgressBar({ currentStep, totalSteps }: StepProgressBarProps) {
  const steps = [
    { id: 1, title: 'I. CVEH' },
    { id: 2, title: 'II. Subcomités' },
    { id: 3, title: 'III. Funciones' },
  ];

  return (
    <div className="py-4 mb-8">
      <div className="flex items-center justify-between relative px-4">
        {/* Línea conectora de fondo */}
        <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-slate-200 rounded-full z-0"></div>
        
        {/* Línea conectora de progreso */}
        <div 
          className="absolute left-10 top-1/2 -translate-y-1/2 h-1 bg-teal-600 rounded-full z-0 transition-all duration-500 ease-in-out"
          style={{ width: `calc(${((currentStep - 1) / (totalSteps - 1)) * 100}% - 5rem)` }}
        ></div>

        {/* Círculos de pasos */}
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 shadow-sm ${
                  isCompleted 
                    ? 'bg-teal-600 text-white ring-4 ring-teal-50' 
                    : isCurrent
                      ? 'bg-white text-teal-600 ring-4 ring-teal-100 border-2 border-teal-600'
                      : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
              >
                {isCompleted ? <Check className="w-6 h-6" /> : step.id}
              </div>
              <div className="absolute top-14 whitespace-nowrap hidden sm:block">
                <span className={`text-xs font-bold uppercase tracking-wider ${isCurrent || isCompleted ? 'text-teal-800' : 'text-slate-400'}`}>
                  {step.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
