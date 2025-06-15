export const messages = {
  user: {
    start: 'Привет! Выберите категорию:',
    selectServices: 'Выберите услуги:',
    finishSelection: 'Вы выбрали:',
    total: (sum: number) => `\n💰 Общая сумма: ${sum} MDL`,
    getPdf: '📄 Получить счёт в PDF',
    pdfGenerating: 'Генерация PDF...',
    pdfSuccess: 'PDF успешно сгенерирован!',
    pdfError: 'Ошибка при генерации PDF. Пожалуйста, попробуйте снова.',
    clearSelection: 'Выбор очищен!',
    noUserId: 'Ошибка: не удалось определить пользователя.',
    buttons: {
      car: '🚗 Автомобиль',
      moto: '🏍️ Мотоцикл',
      additional: '🛠 Доп. услуги',
      clearSelection: '🧹 Очистить выбор',
      finishSelection: '✅ Завершить выбор'
    }
  },
  admin: {
    menu: 'Админ-меню:',
    enterPassword: 'Введите пароль администратора:',
    wrongPassword: 'Неверный пароль. Попробуйте снова или используйте /admin для выхода.',
    loginSuccess: 'Вход выполнен!',
    viewServices: '📋 Список услуг:\n\n',
    addServiceCategory: 'Выберите категорию для новой услуги:',
    enterServiceName: 'Введите название услуги:',
    enterServicePrice: 'Введите цену услуги (только число):',
    serviceAdded: '✅ Услуга успешно добавлена!',
    editServiceCategory: 'Выберите категорию для редактирования услуги:',
    selectServiceToEdit: 'Выберите услугу для редактирования:',
    enterNewServiceName: 'Введите новое название услуги (или отправьте - чтобы не менять):',
    enterNewServicePrice: 'Введите новую цену услуги (или отправьте - чтобы не менять):',
    serviceEdited: '✅ Услуга успешно отредактирована!',
    deleteServiceCategory: 'Выберите категорию для удаления услуги:',
    selectServiceToDelete: 'Выберите услугу для удаления:',
    confirmDelete: (name: string, price: number) => `Вы уверены, что хотите удалить услугу "${name}" (${price} MDL)?`,
    deleteCancelled: 'Удаление отменено.',
    serviceDeleted: (name: string) => `✅ Услуга "${name}" удалена!`,
    noServicesInCategory: 'В этой категории нет услуг.',
    exportSuccess: 'Экспорт выполнен!',
    enterCorrectNumber: 'Пожалуйста, введите корректное число или - чтобы не менять:',
    logout: 'Вы вышли из админки. Для входа снова потребуется пароль.',
    noPassword: 'ADMIN_PASSWORD is not set! Please add it to your .env file.',
    buttons: {
      viewServices: ' 📂 Посмотреть услуги ',
      addService: ' ➕ Добавить услугу ',
      editService: ' ✏️ Редактировать услугу ',
      deleteService: ' 🗑 Удалить услугу ',
      exportJson: ' 📁 Экспорт JSON ',
      car: '🚗 Автомобиль',
      moto: '🏍️ Мотоцикл',
      additional: '🛠 Доп. услуги',
      confirmDelete: '✅ Да, удалить',
      cancelDelete: '❌ Нет'
    },
    categories: {
      car: '🚗 Автомобиль',
      moto: '🏍️ Мотоцикл',
      additional: '🛠 Доп. услуги'
    }
  },
  common: {
    back: '⬅️ Назад',
    cancel: '❌ Отмена',
    error: 'Произошла ошибка. Попробуйте ещё раз.'
  },
  pdf: {
    title: 'Малярная студия "Izimoto"',
    date: 'Дата:',
    vehicleNumber: 'Номер транспортного средства:',
    selectedServices: 'Выбранные услуги:',
    total: 'Итого:',
    thankYou: 'Спасибо за обращение!',
    currency: 'MDL',
    fileNotCreated: 'PDF file was not created'
  },
  commands: {
    start: 'Запустить бота',
    admin: 'Панель администратора (требуется пароль)',
    logout: 'Выйти из режима администратора'
  }
}; 