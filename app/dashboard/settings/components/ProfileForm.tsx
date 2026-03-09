"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { FiSave, FiUser, FiMail, FiPhone, FiEdit3, FiUpload, FiCheck } from "react-icons/fi";

const profileSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа").optional().or(z.literal("")),
  username: z.string().min(3, "Имя пользователя минимум 3 символа"),
  email: z.string().email("Неверный email"),
  phone: z.string().optional(),
  bio: z.string().max(500, "Максимум 500 символов").optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: ProfileFormData;
  onSave: (data: ProfileFormData) => Promise<void>;
  phoneVerified?: boolean;
  onPhoneVerified?: () => void;
}

export default function ProfileForm({ initialData, onSave, phoneVerified = false, onPhoneVerified }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [phoneStep, setPhoneStep] = useState<"idle" | "code-sent">("idle");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session, update: updateSession } = useSession();
  const avatarUrl = session?.user?.image ?? null;
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  });
  const currentPhone = watch("phone") ?? "";

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await onSave(data);
      setIsEditing(false);
      toast.success("Профиль сохранён");
    } catch {
      toast.error("Ошибка при сохранении");
    }
  };

  const handleSendPhoneCode = async () => {
    const phone = (currentPhone || initialData.phone || "").trim().replace(/\D/g, "");
    if (phone.length < 10) {
      toast.error("Сначала укажите и сохраните номер телефона");
      return;
    }
    setPhoneSending(true);
    try {
      const res = await fetch("/api/auth/phone/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: currentPhone || initialData.phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPhoneStep("code-sent");
        setPhoneCode("");
        const after = data.canResendAfter ?? 2;
        setPhoneCooldown(after * 60);
        toast.success("Код отправлен на указанный номер");
      } else {
        if (res.status === 429 && data.canResendAfter) {
          setPhoneCooldown(data.canResendAfter * 60);
        }
        toast.error(data.error || "Ошибка отправки кода");
      }
    } catch {
      toast.error("Ошибка отправки");
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!phoneCode.trim() || phoneCode.length < 4) {
      toast.error("Введите код из SMS");
      return;
    }
    setPhoneVerifying(true);
    try {
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: currentPhone || initialData.phone,
          code: phoneCode.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPhoneStep("idle");
        setPhoneCode("");
        onPhoneVerified?.();
        toast.success("Номер подтверждён");
      } else {
        toast.error(data.error || "Неверный код");
      }
    } catch {
      toast.error("Ошибка проверки");
    } finally {
      setPhoneVerifying(false);
    }
  };

  useEffect(() => {
    if (phoneCooldown <= 0) return;
    const t = setTimeout(() => setPhoneCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [phoneCooldown]);

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Ошибка загрузки");
        return;
      }
      await updateSession();
      toast.success("Фото обновлено");
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 flex items-center justify-center text-3xl text-white overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            (initialData.name?.[0] || initialData.username[0] || "?").toUpperCase()
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onAvatarChange}
          disabled={uploading}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition disabled:opacity-50"
        >
          <FiUpload />
          {uploading ? "Загрузка..." : "Загрузить фото"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Имя</label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              {...register("name")}
              disabled={!isEditing}
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-pink-500/40 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:border-pink-500"
            />
          </div>
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Имя пользователя</label>
          <div className="relative">
            <FiEdit3 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              {...register("username")}
              disabled={!isEditing}
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-pink-500/40 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:border-pink-500"
            />
          </div>
          {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              {...register("email")}
              type="email"
              disabled={!isEditing}
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-pink-500/40 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:border-pink-500"
            />
          </div>
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Телефон</label>
          <div className="relative">
            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              {...register("phone")}
              disabled={!isEditing}
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-pink-500/40 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:border-pink-500"
            />
          </div>
          {(currentPhone || initialData.phone) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {phoneVerified ? (
                <span className="inline-flex items-center gap-1 text-sm text-green-400">
                  <FiCheck /> Номер подтверждён
                </span>
              ) : phoneStep === "code-sent" ? (
                <>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Код из SMS"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
                    className="w-28 px-3 py-1.5 bg-black/30 border border-pink-500/40 rounded-lg text-white text-center focus:outline-none focus:border-pink-500"
                  />
                  <button
                    type="button"
                    disabled={phoneVerifying}
                    onClick={handleVerifyPhoneCode}
                    className="px-3 py-1.5 bg-pink-500/80 rounded-lg text-white text-sm hover:bg-pink-500 disabled:opacity-50"
                  >
                    {phoneVerifying ? "..." : "Подтвердить"}
                  </button>
                  <button
                    type="button"
                    disabled={phoneSending || phoneCooldown > 0}
                    onClick={handleSendPhoneCode}
                    className="text-sm text-gray-400 hover:text-pink-400 disabled:opacity-50"
                  >
                    {phoneCooldown > 0 ? `Повторно через ${phoneCooldown} с` : "Отправить код снова"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={phoneSending}
                  onClick={handleSendPhoneCode}
                  className="text-sm text-pink-400 hover:text-pink-300 disabled:opacity-50"
                >
                  {phoneSending ? "Отправка..." : "Подтвердить номер"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">О себе</label>
        <textarea
          {...register("bio")}
          disabled={!isEditing}
          rows={4}
          className="w-full px-4 py-2 bg-black/30 border border-pink-500/40 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:border-pink-500"
        />
        {errors.bio && <p className="text-red-400 text-sm mt-1">{errors.bio.message}</p>}
      </div>

      <div className="flex justify-end gap-2">
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-pink-600/20 border border-pink-500/40 rounded-lg text-pink-400 hover:bg-pink-600/30 transition"
          >
            Редактировать
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!isDirty}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg text-white font-medium hover:shadow-lg transition disabled:opacity-50"
            >
              <FiSave />
              Сохранить
            </button>
          </>
        )}
      </div>
    </form>
  );
}
