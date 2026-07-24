import numpy as np


class FinanceRules:
    # Industry Standards
    STEEL_PER_VEHICLE_TONS = 1.2
    ENERGY_CONSUMPTION_PER_UNIT_KWH = 2500
    FIXED_OVERHEAD_COST_TRY = 5_000_000

    # Yeni Eklenen: Bir aracın çelik dışındaki diğer tüm parça maliyetleri (Motor, Lastik, Yazılım vb.)
    BASE_COMPONENTS_COST_USD = 15000

    @staticmethod
    def calculate_production_volume(base_capacity=1200, market_trend=1.0):
        noise = np.random.normal(0, 50)
        return int((base_capacity * market_trend) + noise)

    @staticmethod
    def calculate_sales_volume(production_volume, demand_factor=0.96):
        return int(production_volume * demand_factor)

    def calculate_sales_price(self, steel_price_usd, margin=0.25):
        """
        Satış fiyatı (USD): Diğer parçalar + Çelik + Kar Marjı.
        """
        unit_cost_usd = self.BASE_COMPONENTS_COST_USD + (steel_price_usd * self.STEEL_PER_VEHICLE_TONS)
        return unit_cost_usd * (1 + margin)

    def calculate_raw_material_cost(self, steel_price_usd, usd_try, volume):
        unit_cost_try = (steel_price_usd * self.STEEL_PER_VEHICLE_TONS) * usd_try
        return unit_cost_try * volume

    def calculate_energy_cost(self, energy_index, usd_try, volume):
        unit_energy_try = (self.ENERGY_CONSUMPTION_PER_UNIT_KWH * energy_index) / 1000
        # Enerji maliyeti TL bazlı ama kur değişimlerinden etkilenir
        return unit_energy_try * volume * (usd_try / 10)

    @staticmethod
    def calculate_labor_cost(labor_cost_per_person_try, employee_count=500):
        return labor_cost_per_person_try * employee_count

    def calculate_total_cost(self, material_cost, energy_cost, labor_cost):
        return material_cost + energy_cost + labor_cost + self.FIXED_OVERHEAD_COST_TRY

    @staticmethod
    def calculate_profit(revenue, total_cost):
        return revenue - total_cost

    @staticmethod
    def calculate_margin(profit, revenue):
        if revenue <= 0: return 0
        return (profit / revenue) * 100