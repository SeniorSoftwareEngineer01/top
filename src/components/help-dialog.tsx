'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Bot } from 'lucide-react';

interface HelpDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ isOpen, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
             <Bot className='h-6 w-6 text-primary' />
             مساعدة WhatsAnalyzer
          </DialogTitle>
          <DialogDescription className='pt-2 text-left'>
            مرحباً بك في WhatsAnalyzer! هذا التطبيق مصمم لتحليل محادثات واتساب الخاصة بك باستخدام الذكاء الاصطناعي.
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm max-w-none text-foreground [&_ul]:pl-5 [&_strong]:text-primary">
            <h4>الأوامر الخاصة:</h4>
            <ul>
                <li><strong>.help</strong>: لعرض رسالة المساعدة هذه.</li>
                <li><strong>.key</strong>: لإدارة مفتاح Google AI API الخاص بك. يمكنك تعيين مفتاح جديد أو اختباره.</li>
                <li><strong>.lang</strong>: لتغيير لغة ردود الذكاء الاصطناعي (العربية / الفرنسية).</li>
                <li><strong>.stt</strong>: لتحويل آخر رسالة من الذكاء الاصطناعي إلى كلام مسموع.</li>
                <li><strong>.ex</strong>: للخروج من المحادثة الحالية والعودة إلى الصفحة الرئيسية.</li>
            </ul>

            <h4>طرق الاستخدام الشائعة:</h4>
            <ul>
                <li><strong>للتلخيص:</strong> اطلب "لخص هذه المحادثة" أو "ما هي أهم النقاط؟".</li>
                <li><strong>لطرح أسئلة محددة:</strong> اسأل عن أي شيء في المحادثة، مثل "كم مرة تم ذكر كلمة 'مشروع'؟".</li>
                <li><strong>لتحليل الوسائط:</strong> انقر نقرًا مزدوجًا على أي رسالة (نص، صورة، صوت) ثم اطرح سؤالك لتحليلها في سياقها.</li>
                <li><strong>لإنشاء مخططات:</strong> اطلب "أنشئ مخططًا دائريًا يوضح أكثر المتحدثين" أو "ارسم مخططًا زمنيًا للمحادثة".</li>
            </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    