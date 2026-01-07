// app/plans/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, Shield, Users, Globe, CreditCard, TrendingUp, Filter, ArrowUpDown } from 'lucide-react';
import { apiService } from '../lib/api';
import { Plan, Subscription } from '../lib/types';

const PlansPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [creatingSubscription, setCreatingSubscription] = useState<number | null>(null);
  const [cancelingSubscription, setCancelingSubscription] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // 'asc' for lowest first, 'desc' for highest first
  const [activeSort, setActiveSort] = useState<'price' | 'popularity'>('price');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionsData] = await Promise.all([
        apiService.getPlans(),
        apiService.getSubscriptions(),
      ]);
      setPlans(plansData);
      setSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fix formatPrice function to always return object
  const formatPrice = (price: string, months: number = 1): { perMonth: string; total: string; numeric: number } => {
    try {
      const cleanPrice = price.replace(/[^\d.-]/g, '');
      const num = parseFloat(cleanPrice);
      
      if (isNaN(num)) {
        return { perMonth: price, total: price, numeric: 0 };
      }
      
      const pricePerMonth = selectedBilling === 'yearly' ? num / 12 : num;
      const totalPrice = selectedBilling === 'yearly' ? num * months : num;
      
      const perMonthFormatted = new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: 'UZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(pricePerMonth);
      
      const totalFormatted = new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: 'UZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(totalPrice);
      
      return {
        perMonth: perMonthFormatted,
        total: totalFormatted,
        numeric: num,
      };
    } catch (error) {
      console.error('Error formatting price:', error);
      return { perMonth: price, total: price, numeric: 0 };
    }
  };

  // Sort plans based on selected criteria
  const sortedPlans = useMemo(() => {
    const plansCopy = [...plans];
    
    if (activeSort === 'price') {
      plansCopy.sort((a, b) => {
        // Use the formatPrice function to get numeric value
        const priceA = formatPrice(a.price).numeric;
        const priceB = formatPrice(b.price).numeric;
        
        // Adjust for billing cycle
        const adjustedPriceA = selectedBilling === 'yearly' ? priceA : priceA;
        const adjustedPriceB = selectedBilling === 'yearly' ? priceB : priceB;
        
        return sortOrder === 'asc' ? adjustedPriceA - adjustedPriceB : adjustedPriceB - adjustedPriceA;
      });
    } else if (activeSort === 'popularity') {
      plansCopy.sort((a, b) => {
        // Sort by is_popular flag (true comes first), then by price
        if (a.is_popular && !b.is_popular) return -1;
        if (!a.is_popular && b.is_popular) return 1;
        
        const priceA = formatPrice(a.price).numeric;
        const priceB = formatPrice(b.price).numeric;
        const adjustedPriceA = selectedBilling === 'yearly' ? priceA : priceA;
        const adjustedPriceB = selectedBilling === 'yearly' ? priceB : priceB;
        
        return adjustedPriceA - adjustedPriceB;
      });
    }
    
    return plansCopy;
  }, [plans, activeSort, sortOrder, selectedBilling]);

  const handleSubscribe = async (planId: number) => {
    try {
      setCreatingSubscription(planId);
      const subscription = await apiService.createSubscription({ plan_id: planId });
      setSubscriptions(prev => [...prev, subscription]);
      alert('Obuna muvaffaqiyatli yaratildi!');
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      alert(`Obuna yaratishda xatolik: ${error.message}`);
    } finally {
      setCreatingSubscription(null);
    }
  };

  const handleCancelSubscription = async (subscriptionId: number) => {
    if (!confirm('Obunani bekor qilishni xohlaysizmi?')) return;
    
    try {
      setCancelingSubscription(subscriptionId);
      await apiService.cancelSubscription(subscriptionId);
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
      alert('Obuna muvaffaqiyatli bekor qilindi');
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      alert(`Obunani bekor qilishda xatolik: ${error.message}`);
    } finally {
      setCancelingSubscription(null);
    }
  };

  const isPlanSubscribed = (planId: number) => {
    return subscriptions.some(sub => sub.plan_id === planId && sub.is_active);
  };

  const getPlanFeatures = (plan: Plan) => {
    const baseFeatures = [
      'Cheksiz hodimlar soni',
      'Kundalik hisobotlar',
      'Asosiy analitika',
      'Email yordami',
    ];

    const featuresMap: Record<string, string[]> = {
      free: [
        ...baseFeatures.slice(0, 2),
        'Faqat 1 qurilma',
        'Cheklangan tarix',
      ],
      standard: [
        ...baseFeatures,
        '3 tagacha qurilma',
        '3 oylik tarix',
        'Telegram bildirishnomalari',
      ],
      premium: [
        ...baseFeatures,
        'Cheksiz qurilmalar',
        'Cheksiz tarix',
        'Telegram bildirishnomalari',
        'Maxsus integratsiyalar',
        'Shaxsiy yordam',
        'Avtomatik yangilanishlar',
      ],
    };

    return featuresMap[plan.plan_type] || baseFeatures;
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'premium': return <Zap className="h-8 w-8" />;
      case 'standard': return <Users className="h-8 w-8" />;
      default: return <Globe className="h-8 w-8" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'premium': return 'from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500';
      case 'standard': return 'from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500';
      default: return 'from-gray-600 to-gray-400 dark:from-gray-500 dark:to-gray-400';
    }
  };

  // Get price range for information
  const getPriceRange = () => {
    if (sortedPlans.length === 0) return { min: 0, max: 0 };
    
    const prices = sortedPlans.map(plan => {
      return formatPrice(plan.price).numeric;
    });
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Tariflar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const priceRange = getPriceRange();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              Siz uchun mukammal tarif
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Xodimlaringizni boshqarish uchun kerakli barcha vositalar. O'zingizga mos tarifni tanlang.
          </p>

          {/* Sorting and Filtering Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Saralash:</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              {/* Price Sorting */}
              <button
                onClick={() => {
                  setActiveSort('price');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeSort === 'price'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>Narx bo'yicha</span>
                <span className="text-xs">
                  {sortOrder === 'asc' ? '↑ Pastdan' : '↓ Yuqoridan'}
                </span>
              </button>

              {/* Billing Cycle Toggle */}
              
            </div>

            {/* Price Range Info */}
            <div className="text-center md:text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Narx oralig'i:</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('uz-UZ', {
                  style: 'currency',
                  currency: 'UZS',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(priceRange.min)} - {new Intl.NumberFormat('uz-UZ', {
                  style: 'currency',
                  currency: 'UZS',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(priceRange.max)}
              </div>
            </div>
          </div>

          {/* Sort Order Indicator */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
              <div className={`h-2 w-2 rounded-full ${sortOrder === 'asc' ? 'bg-green-500' : 'bg-purple-500'}`}></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {sortOrder === 'asc' 
                  ? 'Past narxlilardan boshlab tartiblangan' 
                  : 'Yuqori narxlilardan boshlab tartiblangan'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {sortedPlans.map((plan, index) => {
            const isPopular = plan.is_popular || plan.plan_type === 'premium';
            const isSubscribed = isPlanSubscribed(plan.id);
            const price = formatPrice(plan.price, plan.duration_months);
            const features = getPlanFeatures(plan);
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl border-2 p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                  isPopular 
                    ? 'border-purple-500 dark:border-purple-400 bg-gradient-to-b from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 shadow-xl' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg'
                }`}
              >
                {/* Price Ranking Badge */}
                <div className="absolute -top-3 -left-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                    index === 1 ? 'bg-gradient-to-r from-gray-500 to-gray-700' :
                    'bg-gradient-to-r from-amber-800 to-amber-900'
                  }`}>
                    #{index + 1}
                  </div>
                </div>

                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Eng mashhur
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-r ${getPlanColor(plan.plan_type)} text-white mb-4`}>
                    {getPlanIcon(plan.plan_type)}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {price.perMonth.split(' ')[0]}
                      </span>
                      <span className="text-xl text-gray-500 dark:text-gray-400 ml-1">/{plan.billing_cycle}</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      {selectedBilling === 'yearly' ? `Yillik: ${price.total}` : `Oylik: ${price.total}`}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                    Qamrab olingan imkoniyatlar
                  </h4>
                  <ul className="space-y-3">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <div className="mt-auto">
                  {isSubscribed ? (
                    <div className="space-y-3">
                      <button
                        disabled
                        className="w-full py-3 px-4 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold cursor-not-allowed"
                      >
                        <div className="flex items-center justify-center">
                          <Check className="h-5 w-5 mr-2" />
                          Faol obuna
                        </div>
                      </button>
                      <button
                        onClick={() => handleCancelSubscription(
                          subscriptions.find(s => s.plan_id === plan.id && s.is_active)?.id || 0
                        )}
                        disabled={cancelingSubscription === plan.id}
                        className="w-full py-2 px-4 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-medium flex items-center justify-center"
                      >
                        {cancelingSubscription === plan.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 dark:border-red-400 mr-2"></div>
                            Bekor qilinmoqda...
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Obunani bekor qilish
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={creatingSubscription === plan.id}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                        isPopular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-600 dark:hover:to-pink-600 hover:shadow-lg'
                          : 'bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-700 dark:hover:from-blue-600 dark:hover:to-cyan-600 hover:shadow-lg'
                      }`}
                    >
                      {creatingSubscription === plan.id ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Jarayonda...
                        </div>
                      ) : (
                        'Obuna bo\'lish'
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Xavfsizlik kafolati</h4>
            <p className="text-gray-600 dark:text-gray-300">Ma'lumotlaringiz 256-bit shifrlash orqali himoyalangan</p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
              <CreditCard className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Qulay to'lov</h4>
            <p className="text-gray-600 dark:text-gray-300">Bank kartalari, Click, Payme va boshqa to'lov tizimlari</p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-4">
              <TrendingUp className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Biznesni rivojlantiring</h4>
            <p className="text-gray-600 dark:text-gray-300">Xodimlar samaradorligini 40% ga oshiring</p>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Tez-tez beriladigan savollar
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: "Tarifni o'zgartirishim mumkinmi?",
                a: "Ha, istalgan vaqtda yuqori yoki pastroq tarifga o'tishingiz mumkin. Farq to'lanadi yoki qaytariladi."
              },
              {
                q: "Obunani bekor qilsam, ma'lumotlarim saqlanadimi?",
                a: "Ha, ma'lumotlaringiz 30 kun saqlanadi. Bu muddat ichida obunani qayta faollashtirsangiz, barcha ma'lumotlaringiz qayta tiklanadi."
              },
              {
                q: "Qancha vaqt ichida tizim ishga tushadi?",
                a: "To'lovdan so'ng darhol tizim ishga tushadi. Hech qanday texnik sozlamalar talab qilinmaydi."
              },
              {
                q: "Mijozlarga yordam ko'rsatiladimi?",
                a: "Albatta! Barcha tariflar uchun email va chat orqali yordam mavjud. Premium tarifda shaxsiy menejer ham."
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h4>
                <p className="text-gray-600 dark:text-gray-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlansPage;